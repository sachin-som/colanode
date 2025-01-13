import { MarkEntrySeenMutation, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  EntryMarkSeenMutationInput,
  EntryMarkSeenMutationOutput,
} from '@/shared/mutations/entries/entry-mark-seen';
import { eventBus } from '@/shared/lib/event-bus';
import { mapEntryInteraction } from '@/main/utils';

export class EntryMarkSeenMutationHandler
  implements MutationHandler<EntryMarkSeenMutationInput>
{
  async handleMutation(
    input: EntryMarkSeenMutationInput
  ): Promise<EntryMarkSeenMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const entry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', input.entryId)
      .executeTakeFirst();

    if (!entry) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspaceDatabase
      .selectFrom('entry_interactions')
      .selectAll()
      .where('entry_id', '=', input.entryId)
      .where('collaborator_id', '=', input.userId)
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

    const { createdInteraction, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdInteraction = await trx
          .insertInto('entry_interactions')
          .returningAll()
          .values({
            entry_id: input.entryId,
            collaborator_id: input.userId,
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
            collaboratorId: input.userId,
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

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'entry_interaction_updated',
      userId: input.userId,
      entryInteraction: mapEntryInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
