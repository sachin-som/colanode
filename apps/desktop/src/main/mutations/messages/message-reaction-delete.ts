import {
  DeleteMessageReactionMutation,
  generateId,
  IdType,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MessageReactionDeleteMutationInput,
  MessageReactionDeleteMutationOutput,
} from '@/shared/mutations/messages/message-reaction-delete';
import { mapMessageReaction } from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

export class MessageReactionDeleteMutationHandler
  implements MutationHandler<MessageReactionDeleteMutationInput>
{
  async handleMutation(
    input: MessageReactionDeleteMutationInput
  ): Promise<MessageReactionDeleteMutationOutput> {
    const workspaceDatabase = await databaseService.getWorkspaceDatabase(
      input.userId
    );

    const existingMessageReaction = await workspaceDatabase
      .selectFrom('message_reactions')
      .selectAll()
      .where('message_id', '=', input.messageId)
      .where('collaborator_id', '=', input.userId)
      .where('reaction', '=', input.reaction)
      .executeTakeFirst();

    if (!existingMessageReaction) {
      return {
        success: true,
      };
    }

    const { deletedMessageReaction, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const deletedMessageReaction = await trx
          .updateTable('message_reactions')
          .returningAll()
          .set({
            deleted_at: new Date().toISOString(),
          })
          .where('message_id', '=', input.messageId)
          .where('collaborator_id', '=', input.userId)
          .where('reaction', '=', input.reaction)
          .executeTakeFirst();

        if (!deletedMessageReaction) {
          throw new Error('Failed to delete message reaction');
        }

        const mutation: DeleteMessageReactionMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'delete_message_reaction',
          data: {
            messageId: input.messageId,
            reaction: deletedMessageReaction.reaction,
            rootId: input.rootId,
            deletedAt: new Date().toISOString(),
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
          deletedMessageReaction,
          createdMutation,
        };
      });

    if (!deletedMessageReaction || !createdMutation) {
      throw new Error('Failed to delete message reaction');
    }

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'message_reaction_deleted',
      userId: input.userId,
      messageReaction: mapMessageReaction(deletedMessageReaction),
    });

    return {
      success: true,
    };
  }
}
