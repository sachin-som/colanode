import {
  canCreateMessageReaction,
  CreateMessageReactionMutation,
  generateId,
  IdType,
} from '@colanode/core';

import { MutationHandler } from '@/main/types';
import {
  MessageReactionCreateMutationInput,
  MessageReactionCreateMutationOutput,
} from '@/shared/mutations/messages/message-reaction-create';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry, mapEntry, mapMessageReaction } from '@/main/utils';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class MessageReactionCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageReactionCreateMutationInput>
{
  async handleMutation(
    input: MessageReactionCreateMutationInput
  ): Promise<MessageReactionCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const message = await workspace.database
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', input.messageId)
      .executeTakeFirst();

    if (!message) {
      throw new MutationError(
        MutationErrorCode.MessageNotFound,
        'Message not found or has been deleted.'
      );
    }

    const existingMessageReaction = await workspace.database
      .selectFrom('message_reactions')
      .selectAll()
      .where('message_id', '=', input.messageId)
      .where('collaborator_id', '=', workspace.userId)
      .where('reaction', '=', input.reaction)
      .executeTakeFirst();

    if (existingMessageReaction) {
      return {
        success: true,
      };
    }

    const root = await fetchEntry(workspace.database, input.rootId);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canCreateMessageReaction({
        user: {
          userId: workspace.userId,
          role: workspace.role,
        },
        root: mapEntry(root),
        message: {
          id: message.id,
          createdBy: message.created_by,
        },
      })
    ) {
      throw new MutationError(
        MutationErrorCode.MessageReactionCreateForbidden,
        "You don't have permission to react to this message."
      );
    }

    const { createdMessageReaction, createdMutation } = await workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdMessageReaction = await trx
          .insertInto('message_reactions')
          .returningAll()
          .values({
            message_id: input.messageId,
            collaborator_id: workspace.userId,
            reaction: input.reaction,
            root_id: input.rootId,
            version: 0n,
            created_at: new Date().toISOString(),
          })
          .onConflict((cb) =>
            cb
              .columns(['message_id', 'collaborator_id', 'reaction'])
              .doUpdateSet({
                deleted_at: null,
              })
          )
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

    workspace.mutations.triggerSync();

    eventBus.publish({
      type: 'message_reaction_created',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      messageReaction: mapMessageReaction(createdMessageReaction),
    });

    return {
      success: true,
    };
  }
}
