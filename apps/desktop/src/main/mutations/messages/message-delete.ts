import {
  canDeleteMessage,
  DeleteMessageMutationData,
  generateId,
  IdType,
} from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@/shared/mutations/messages/message-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchEntry, fetchUser, mapEntry, mapMessage } from '@/main/utils';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class MessageDeleteMutationHandler
  implements MutationHandler<MessageDeleteMutationInput>
{
  async handleMutation(
    input: MessageDeleteMutationInput
  ): Promise<MessageDeleteMutationOutput> {
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
        success: true,
      };
    }

    const user = await fetchUser(workspaceDatabase, input.userId);
    if (!user) {
      throw new MutationError(
        MutationErrorCode.UserNotFound,
        'There was an error while fetching the user. Please make sure you are logged in.'
      );
    }

    const entry = await fetchEntry(workspaceDatabase, message.entry_id);
    if (!entry) {
      throw new MutationError(
        MutationErrorCode.EntryNotFound,
        'There was an error while fetching the conversation. Please make sure you have access to this conversation.'
      );
    }

    const root = await fetchEntry(workspaceDatabase, message.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canDeleteMessage({
        user: {
          userId: input.userId,
          role: user.role,
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

    await workspaceDatabase.transaction().execute(async (tx) => {
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
      userId: input.userId,
      message: mapMessage(message),
    });

    eventBus.publish({
      type: 'mutation_created',
      userId: input.userId,
    });

    return {
      success: true,
    };
  }
}
