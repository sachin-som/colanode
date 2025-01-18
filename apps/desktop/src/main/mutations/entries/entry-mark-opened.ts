import { MarkEntryOpenedMutation, generateId, IdType } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  EntryMarkOpenedMutationInput,
  EntryMarkOpenedMutationOutput,
} from '@/shared/mutations/entries/entry-mark-opened';
import { eventBus } from '@/shared/lib/event-bus';
import { mapEntryInteraction } from '@/main/lib/mappers';
import { fetchEntry } from '@/main/lib/utils';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class EntryMarkOpenedMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<EntryMarkOpenedMutationInput>
{
  async handleMutation(
    input: EntryMarkOpenedMutationInput
  ): Promise<EntryMarkOpenedMutationOutput> {
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
      const lastOpenedAt = existingInteraction.last_opened_at;
      if (
        lastOpenedAt &&
        lastOpenedAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
      ) {
        return {
          success: true,
        };
      }
    }

    const lastOpenedAt = new Date().toISOString();
    const firstOpenedAt = existingInteraction
      ? existingInteraction.first_opened_at
      : lastOpenedAt;

    const { createdInteraction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('entry_interactions')
          .returningAll()
          .values({
            entry_id: input.entryId,
            collaborator_id: workspace.userId,
            last_opened_at: lastOpenedAt,
            first_opened_at: firstOpenedAt,
            version: 0n,
            root_id: entry.root_id,
          })
          .onConflict((b) =>
            b.columns(['entry_id', 'collaborator_id']).doUpdateSet({
              last_opened_at: lastOpenedAt,
              first_opened_at: firstOpenedAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create file interaction');
        }

        const mutation: MarkEntryOpenedMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_entry_opened',
          data: {
            entryId: input.entryId,
            collaboratorId: workspace.userId,
            openedAt: new Date().toISOString(),
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
