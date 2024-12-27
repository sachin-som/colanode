import { DeleteMessageMutationData, generateId, IdType } from '@colanode/core';

import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  MessageDeleteMutationInput,
  MessageDeleteMutationOutput,
} from '@/shared/mutations/messages/message-delete';
import { eventBus } from '@/shared/lib/event-bus';
import { mapMessage } from '@/main/utils';

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

    const deletedAt = new Date().toISOString();
    const deleteMessageMutationData: DeleteMessageMutationData = {
      id: input.messageId,
      rootId: message.root_id,
      deletedAt,
    };

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('messages')
        .where('id', '=', input.messageId)
        .execute();

      await tx
        .insertInto('mutations')
        .values({
          id: generateId(IdType.Mutation),
          type: 'delete_message',
          node_id: input.messageId,
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
