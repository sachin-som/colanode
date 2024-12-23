import {
  CreateMessageReactionMutation,
  generateId,
  IdType,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MessageReactionCreateMutationInput,
  MessageReactionCreateMutationOutput,
} from '@/shared/mutations/messages/message-reaction-create';
import { eventBus } from '@/shared/lib/event-bus';
import { mapMessageReaction } from '@/main/utils';

export class MessageReactionCreateMutationHandler
  implements MutationHandler<MessageReactionCreateMutationInput>
{
  async handleMutation(
    input: MessageReactionCreateMutationInput
  ): Promise<MessageReactionCreateMutationOutput> {
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

    if (existingMessageReaction) {
      return {
        success: true,
      };
    }

    const { createdMessageReaction, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdMessageReaction = await trx
          .insertInto('message_reactions')
          .returningAll()
          .values({
            message_id: input.messageId,
            collaborator_id: input.userId,
            reaction: input.reaction,
            root_id: input.rootId,
            version: 0n,
            created_at: new Date().toISOString(),
          })
          .executeTakeFirst();

        if (!createdMessageReaction) {
          throw new Error('Failed to create message reaction');
        }

        const mutation: CreateMessageReactionMutation = {
          id: generateId(IdType.Mutation),
          createdAt: new Date().toISOString(),
          type: 'create_message_reaction',
          data: {
            messageId: input.messageId,
            reaction: input.reaction,
            rootId: input.rootId,
            createdAt: new Date().toISOString(),
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
          createdMessageReaction,
          createdMutation,
        };
      });

    if (!createdMessageReaction || !createdMutation) {
      throw new Error('Failed to create message reaction');
    }

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    eventBus.publish({
      type: 'message_reaction_created',
      userId: input.userId,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });

    return {
      success: true,
    };
  }
}
