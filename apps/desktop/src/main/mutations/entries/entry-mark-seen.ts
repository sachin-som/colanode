import { MarkEntrySeenMutation, generateId, IdType } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  EntryMarkSeenMutationInput,
  EntryMarkSeenMutationOutput,
} from '@/shared/mutations/entries/entry-mark-seen';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry } from '@/main/lib/utils';
import { mapEntryInteraction } from '@/main/lib/mappers';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class EntryMarkSeenMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<EntryMarkSeenMutationInput>
{
  async handleMutation(
    input: EntryMarkSeenMutationInput
  ): Promise<EntryMarkSeenMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const entry = await fetchEntry(workspace.database, input.entryId);

    if (!entry) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspace.database
      .selectFrom('entry_interactions')
      .selectAll()
      .where('entry_id', '=', input.entryId)
      .where('collaborator_id', '=', workspace.userId)
      .executeTakeFirst();

    if (existingInteraction) {
      const lastSeenAt = existingInteraction.last_seen_at;
      if (
        lastSeenAt &&
        lastSeenAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      ) {
        return {
          success: true,
        };
      }
    }

    const lastSeenAt = new Date().toISOString();
    const firstSeenAt = existingInteraction
      ? existingInteraction.first_seen_at
      : lastSeenAt;

    const { createdInteraction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('entry_interactions')
          .returningAll()
          .values({
            entry_id: input.entryId,
            collaborator_id: workspace.userId,
            last_seen_at: lastSeenAt,
            first_seen_at: firstSeenAt,
            version: 0n,
            root_id: entry.root_id,
          })
          .onConflict((b) =>
            b.columns(['entry_id', 'collaborator_id']).doUpdateSet({
              last_seen_at: lastSeenAt,
              first_seen_at: firstSeenAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create entry interaction');
        }

        const mutation: MarkEntrySeenMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_entry_seen',
          data: {
            entryId: input.entryId,
            collaboratorId: workspace.userId,
            seenAt: new Date().toISOString(),
          },
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: mutation.id,
            type: mutation.type,
            data: JSON.stringify(mutation.data),
            created_at: mutation.createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        return {
          createdInteraction,
          createdMutation,
        };
      });

    if (!createdInteraction || !createdMutation) {
      throw new Error('Failed to create entry interaction');
    }

    workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'entry_interaction_updated',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      entryInteraction: mapEntryInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
