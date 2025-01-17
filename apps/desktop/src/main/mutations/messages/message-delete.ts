import {
  canDeleteMessage,
  DeleteMessageMutationData,
  generateId,
  IdType,
} from '@colanode/core';

import { MutationHandler } from '@/main/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@/shared/mutations/messages/message-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry, mapEntry, mapMessage } from '@/main/utils';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';
export class MessageDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageDeleteMutationInput>
{
  async handleMutation(
    input: MessageDeleteMutationInput
  ): Promise<MessageDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const message = await workspace.database
      .selectFrom('messages')
      .selectAll()
      .where('id', '=', input.messageId)
      .executeTakeFirst();

    if (!message) {
      return {
        success: true,
      };
    }

    const entry = await fetchEntry(workspace.database, message.entry_id);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the conversation. Please make sure you have access to this conversation.'
      );
    }

    const root = await fetchEntry(workspace.database, message.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canDeleteMessage({
        user: {
          userId: workspace.userId,
          role: workspace.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
        message: {
          id: message.id,
          createdBy: message.created_by,
        },
      })
    ) {
      throw new MutationError(
        MutationErrorCode.MessageDeleteForbidden,
        'You are not allowed to delete this message.'
      );
    }

    const deletedAt = new Date().toISOString();
    const deleteMessageMutationData: DeleteMessageMutationData = {
      id: input.messageId,
      rootId: message.root_id,
      deletedAt,
    };

    await workspace.database.transaction().execute(async (tx) => {
      await tx
        .updateTable('messages')
        .set({
          deleted_at: deletedAt,
        })
        .where('id', '=', input.messageId)
        .execute();

      await tx
        .insertInto('mutations')
        .values({
          id: generateId(IdType.Mutation),
          type: 'delete_message',
          data: JSON.stringify(deleteMessageMutationData),
          created_at: deletedAt,
          retries: 0,
        })
        .execute();
    });

    eventBus.publish({
      type: 'message_deleted',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
      message: mapMessage(message),
    });

    workspace.mutations.triggerSync();

    return {
      success: true,
    };
  }
}
