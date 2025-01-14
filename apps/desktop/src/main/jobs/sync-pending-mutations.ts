import { Mutation, SyncMutationsOutput } from '@colanode/core';

import { fetchWorkspaceCredentials, mapMutation } from '@/main/utils';
import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import { JobHandler } from '@/main/jobs';
import { httpClient } from '@/shared/lib/http-client';

export type SyncPendingMutationsInput = {
  type: 'sync_pending_mutations';
  userId: string;
};

declare module '@/main/jobs' {
  interface JobMap {
    sync_pending_mutations: {
      input: SyncPendingMutationsInput;
    };
  }
}

const READ_SIZE = 500;
const BATCH_SIZE = 50;

export class SyncPendingMutationsJobHandler
  implements JobHandler<SyncPendingMutationsInput>
{
  public triggerDebounce = 0;
  public interval = 1000 * 60;

  private readonly debug = createDebugger('job:sync-pending-mutations');

  public async handleJob(input: SyncPendingMutationsInput) {
    let hasMore = true;

    while (hasMore) {
      hasMore = await this.syncMutations(input);
    }
  }

  private async syncMutations(
    input: SyncPendingMutationsInput
  ): Promise<boolean> {
    this.debug(`Sending local pending mutations for user ${input.userId}`);

    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const unsyncedMutations = await workspaceDatabase
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
      await this.consolidateMutations(allMutations);

    if (deletedMutationIds.size > 0) {
      this.debug(
        `Deleting ${deletedMutationIds.size} redundant local pending mutations for user ${input.userId}`
      );

      await workspaceDatabase
        .deleteFrom('mutations')
        .where('id', 'in', Array.from(deletedMutationIds))
        .execute();
    }

    this.debug(
      `Sending ${unsyncedMutations.length} local pending mutations for user ${input.userId}`
    );

    const credentials = await fetchWorkspaceCredentials(input.userId);
    if (!credentials) {
      this.debug(
        `No workspace credentials found for user ${input.userId}, skipping sending local pending mutations`
      );
      return false;
    }

    if (!serverService.isAvailable(credentials.serverDomain)) {
      this.debug(
        `Server ${credentials.serverDomain} is not available, skipping sending local pending mutations`
      );
      return false;
    }

    const totalBatches = Math.ceil(validMutations.length / BATCH_SIZE);
    let currentBatch = 1;

    try {
      while (validMutations.length > 0) {
        const batch = validMutations.splice(0, BATCH_SIZE);

        this.debug(
          `Sending batch ${currentBatch++} of ${totalBatches} mutations for user ${input.userId}`
        );

        const { data } = await httpClient.post<SyncMutationsOutput>(
          `/v1/workspaces/${credentials.workspaceId}/mutations`,
          {
            mutations: batch,
          },
          {
            domain: credentials.serverDomain,
            token: credentials.token,
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
          this.debug(
            `Marking ${syncedMutationIds.length} local pending mutations as sent for user ${input.userId}`
          );

          await workspaceDatabase
            .deleteFrom('mutations')
            .where('id', 'in', syncedMutationIds)
            .execute();
        }

        if (unsyncedMutationIds.length > 0) {
          this.debug(
            `Marking ${unsyncedMutationIds.length} local pending mutations as failed for user ${input.userId}`
          );

          await workspaceDatabase
            .updateTable('mutations')
            .set((eb) => ({ retries: eb('retries', '+', 1) }))
            .where('id', 'in', unsyncedMutationIds)
            .execute();
        }
      }
    } catch (error) {
      this.debug(
        `Failed to send local pending mutations for user ${input.userId}: ${error}`
      );
    }

    return unsyncedMutations.length === READ_SIZE;
  }

  private async consolidateMutations(mutations: Mutation[]) {
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
