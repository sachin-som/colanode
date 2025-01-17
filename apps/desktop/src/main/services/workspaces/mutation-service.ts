import { createDebugger, Mutation, SyncMutationsOutput } from '@colanode/core';
import ms from 'ms';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { mapMutation } from '@/main/utils';
import { EventLoop } from '@/shared/lib/event-loop';

const READ_SIZE = 500;
const BATCH_SIZE = 50;

export class MutationService {
  private readonly debug = createDebugger('desktop:service:mutation');
  private readonly workspace: WorkspaceService;
  private readonly eventLoop: EventLoop;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;

    this.eventLoop = new EventLoop(ms('1 minute'), ms('1 second'), () => {
      this.sync();
    });

    this.eventLoop.start();
  }

  public destroy(): void {
    this.eventLoop.stop();
  }

  public triggerSync(): void {
    this.eventLoop.trigger();
  }

  private async sync(): Promise<void> {
    try {
      let hasMore = true;

      while (hasMore) {
        hasMore = await this.sendMutations();
      }

      await this.revertInvalidMutations();
    } catch (error) {
      this.debug(`Error syncing mutations: ${error}`);
    }
  }

  private async sendMutations(): Promise<boolean> {
    if (!this.workspace.account.server.isAvailable()) {
      return false;
    }

    const unsyncedMutations = await this.workspace.database
      .selectFrom('mutations')
      .selectAll()
      .orderBy('id', 'asc')
      .limit(READ_SIZE)
      .execute();

    if (unsyncedMutations.length === 0) {
      return false;
    }

    const allMutations: Mutation[] = unsyncedMutations.map(mapMutation);
    const { validMutations, deletedMutationIds } =
      this.consolidateMutations(allMutations);

    if (deletedMutationIds.size > 0) {
      await this.deleteMutations(
        Array.from(deletedMutationIds),
        'consolidated'
      );
    }

    this.debug(
      `Sending ${unsyncedMutations.length} local pending mutations for user ${this.workspace.id}`
    );

    const totalBatches = Math.ceil(validMutations.length / BATCH_SIZE);
    let currentBatch = 1;

    try {
      while (validMutations.length > 0) {
        const batch = validMutations.splice(0, BATCH_SIZE);

        this.debug(
          `Sending batch ${currentBatch++} of ${totalBatches} mutations for user ${this.workspace.id}`
        );

        const { data } =
          await this.workspace.account.client.post<SyncMutationsOutput>(
            `/v1/workspaces/${this.workspace.id}/mutations`,
            {
              mutations: batch,
            }
          );

        const syncedMutationIds: string[] = [];
        const unsyncedMutationIds: string[] = [];

        for (const result of data.results) {
          if (result.status === 'success') {
            syncedMutationIds.push(result.id);
          } else {
            unsyncedMutationIds.push(result.id);
          }
        }

        if (syncedMutationIds.length > 0) {
          await this.deleteMutations(syncedMutationIds, 'synced');
        }

        if (unsyncedMutationIds.length > 0) {
          await this.markMutationsAsFailed(unsyncedMutationIds);
        }
      }
    } catch (error) {
      this.debug(
        `Failed to send local pending mutations for user ${this.workspace.id}: ${error}`
      );
    }

    return unsyncedMutations.length === READ_SIZE;
  }

  private async revertInvalidMutations(): Promise<void> {
    const invalidMutations = await this.workspace.database
      .selectFrom('mutations')
      .selectAll()
      .where('retries', '>=', 10)
      .execute();

    if (invalidMutations.length === 0) {
      return;
    }

    this.debug(
      `Reverting ${invalidMutations.length} invalid mutations for workspace ${this.workspace.id}`
    );

    for (const mutationRow of invalidMutations) {
      const mutation = mapMutation(mutationRow);

      if (mutation.type === 'create_file') {
        await this.workspace.files.revertFileCreation(mutation.id);
      } else if (mutation.type === 'delete_file') {
        await this.workspace.files.revertFileDeletion(mutation.id);
      } else if (mutation.type === 'apply_create_transaction') {
        await this.workspace.entries.revertCreateTransaction(mutation.data);
      } else if (mutation.type === 'apply_update_transaction') {
        await this.workspace.entries.revertUpdateTransaction(mutation.data);
      } else if (mutation.type === 'apply_delete_transaction') {
        await this.workspace.entries.revertDeleteTransaction(mutation.data);
      } else if (mutation.type === 'create_message') {
        await this.workspace.messages.revertMessageCreation(mutation.data.id);
      } else if (mutation.type === 'delete_message') {
        await this.workspace.messages.revertMessageDeletion(mutation.data.id);
      } else if (mutation.type === 'create_message_reaction') {
        await this.workspace.messages.revertMessageReactionCreation(
          mutation.data
        );
      } else if (mutation.type === 'delete_message_reaction') {
        await this.workspace.messages.revertMessageReactionDeletion(
          mutation.data
        );
      }
    }

    const mutationIds = invalidMutations.map((m) => m.id);
    await this.deleteMutations(mutationIds, 'invalid');
  }

  private async deleteMutations(
    mutationIds: string[],
    reason: string
  ): Promise<void> {
    this.debug(
      `Deleting ${mutationIds.length} local mutations for user ${this.workspace.id}. Reason: ${reason}`
    );

    await this.workspace.database
      .deleteFrom('mutations')
      .where('id', 'in', mutationIds)
      .execute();
  }

  private async markMutationsAsFailed(mutationIds: string[]): Promise<void> {
    this.debug(
      `Marking ${mutationIds.length} local pending mutations as failed for user ${this.workspace.id}`
    );

    await this.workspace.database
      .updateTable('mutations')
      .set((eb) => ({ retries: eb('retries', '+', 1) }))
      .where('id', 'in', mutationIds)
      .execute();
  }

  private consolidateMutations(mutations: Mutation[]) {
    const validMutations: Mutation[] = [];
    const deletedMutationIds: Set<string> = new Set();

    for (let i = mutations.length - 1; i >= 0; i--) {
      const mutation = mutations[i];
      if (!mutation) {
        continue;
      }

      if (deletedMutationIds.has(mutation.id)) {
        continue;
      }

      if (mutation.type === 'apply_delete_transaction') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'apply_create_transaction' &&
            previousMutation.data.id === mutation.data.id
          ) {
            deletedMutationIds.add(mutation.id);
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'apply_update_transaction' &&
            previousMutation.data.id === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'mark_entry_opened' &&
            previousMutation.data.entryId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'mark_entry_seen' &&
            previousMutation.data.entryId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'delete_file') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'create_file' &&
            previousMutation.data.id === mutation.data.id
          ) {
            deletedMutationIds.add(mutation.id);
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'mark_file_seen' &&
            previousMutation.data.fileId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'mark_file_opened' &&
            previousMutation.data.fileId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'delete_message') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'create_message' &&
            previousMutation.data.id === mutation.data.id
          ) {
            deletedMutationIds.add(mutation.id);
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'mark_message_seen' &&
            previousMutation.data.messageId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'create_message_reaction' &&
            previousMutation.data.messageId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'delete_message_reaction' &&
            previousMutation.data.messageId === mutation.data.id
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'delete_message_reaction') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'create_message_reaction' &&
            previousMutation.data.messageId === mutation.data.messageId &&
            previousMutation.data.reaction === mutation.data.reaction
          ) {
            deletedMutationIds.add(mutation.id);
            deletedMutationIds.add(previousMutation.id);
          } else if (
            previousMutation.type === 'delete_message_reaction' &&
            previousMutation.data.messageId === mutation.data.messageId &&
            previousMutation.data.reaction === mutation.data.reaction
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'mark_entry_seen') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'mark_entry_seen' &&
            previousMutation.data.entryId === mutation.data.entryId
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'mark_entry_opened') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'mark_entry_opened' &&
            previousMutation.data.entryId === mutation.data.entryId
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'mark_file_seen') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'mark_file_seen' &&
            previousMutation.data.fileId === mutation.data.fileId
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'mark_file_opened') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'mark_file_opened' &&
            previousMutation.data.fileId === mutation.data.fileId
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      } else if (mutation.type === 'mark_message_seen') {
        for (let j = i - 1; j >= 0; j--) {
          const previousMutation = mutations[j];
          if (!previousMutation) {
            continue;
          }

          if (
            previousMutation.type === 'mark_message_seen' &&
            previousMutation.data.messageId === mutation.data.messageId
          ) {
            deletedMutationIds.add(previousMutation.id);
          }
        }
      }

      if (!deletedMutationIds.has(mutation.id)) {
        validMutations.push(mutation);
      }
    }

    return {
      validMutations,
      deletedMutationIds,
    };
  }
}
