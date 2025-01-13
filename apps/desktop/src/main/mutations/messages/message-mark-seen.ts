import { MarkMessageSeenMutation, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MessageMarkSeenMutationInput,
  MessageMarkSeenMutationOutput,
} from '@/shared/mutations/messages/message-mark-seen';
import { eventBus } from '@/shared/lib/event-bus';
import { mapMessageInteraction } from '@/main/utils';

export class MessageMarkSeenMutationHandler
  implements MutationHandler<MessageMarkSeenMutationInput>
{
  async handleMutation(
    input: MessageMarkSeenMutationInput
  ): Promise<MessageMarkSeenMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const message = await workspaceDatabase
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', input.messageId)
      .executeTakeFirst();

    if (!message) {
      return {
        success: false,
      };
    }

    const existingInteraction = await workspaceDatabase
      .selectFrom('message_interactions')
      .selectAll()
      .where('message_id', '=', input.messageId)
      .where('collaborator_id', '=', input.userId)
      .executeTakeFirst();

    if (existingInteraction) {
      const lastSeenAt = existingInteraction.last_seen_at;
      if (
        lastSeenAt &&
        lastSeenAt > new Date(Date.now() - 5 * 1000).toISOString()
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
          .insertInto('message_interactions')
          .returningAll()
          .values({
            message_id: input.messageId,
            collaborator_id: input.userId,
            first_seen_at: firstSeenAt,
            last_seen_at: lastSeenAt,
            version: 0n,
            root_id: message.root_id,
          })
          .onConflict((b) =>
            b.columns(['message_id', 'collaborator_id']).doUpdateSet({
              first_seen_at: firstSeenAt,
              last_seen_at: lastSeenAt,
            })
          )
          .executeTakeFirst();

        if (!createdInteraction) {
          throw new Error('Failed to create message interaction');
        }

        const mutation: MarkMessageSeenMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'mark_message_seen',
          data: {
            messageId: input.messageId,
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
            node_id: input.messageId,
            retries: 0,
          })
          .executeTakeFirst();

        return {
          createdInteraction,
          createdMutation,
        };
      });

    if (!createdInteraction || !createdMutation) {
      throw new Error('Failed to create message interaction');
    }

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'message_interaction_updated',
      userId: input.userId,
      messageInteraction: mapMessageInteraction(createdInteraction),
    });

    return {
      success: true,
    };
  }
}
