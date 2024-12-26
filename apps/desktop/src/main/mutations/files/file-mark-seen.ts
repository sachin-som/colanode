import { MarkFileSeenMutation, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  FileMarkSeenMutationInput,
  FileMarkSeenMutationOutput,
} from '@/shared/mutations/files/file-mark-seen';
import { eventBus } from '@/shared/lib/event-bus';
import { mapFileInteraction } from '@/main/utils';

export class FileMarkSeenMutationHandler
  implements MutationHandler<FileMarkSeenMutationInput>
{
  async handleMutation(
    input: FileMarkSeenMutationInput
  ): Promise<FileMarkSeenMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const file = await workspaceDatabase
      .selectFrom('files')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!file) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspaceDatabase
      .selectFrom('file_interactions')
      .selectAll()
      .where('file_id', '=', input.fileId)
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
          .insertInto('file_interactions')
          .returningAll()
          .values({
            file_id: input.fileId,
            collaborator_id: input.userId,
            last_seen_at: lastSeenAt,
            first_seen_at: firstSeenAt,
            version: 0n,
            root_id: file.root_id,
          })
          .onConflict((b) =>
            b.columns(['file_id', 'collaborator_id']).doUpdateSet({
              last_seen_at: lastSeenAt,
              first_seen_at: firstSeenAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create file interaction');
        }

        const mutation: MarkFileSeenMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_file_seen',
          data: {
            fileId: input.fileId,
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
            node_id: input.fileId,
            retries: 0,
          })
          .executeTakeFirst();

        return {
          createdInteraction,
          createdMutation,
        };
      });

    if (!createdInteraction || !createdMutation) {
      throw new Error('Failed to create file interaction');
    }

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'file_interaction_updated',
      userId: input.userId,
      fileInteraction: mapFileInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
