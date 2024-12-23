import {
  CreateMessageMutation,
  CreateMessageReactionMutation,
  DeleteMessageReactionMutation,
  extractNodeRole,
  hasCollaboratorAccess,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { mapNode } from '@/lib/nodes';
import { eventBus } from '@/lib/event-bus';

class MessageService {
  public async createMessage(
    user: SelectUser,
    mutation: CreateMessageMutation
  ): Promise<boolean> {
    const existingMessage = await database
      .selectFrom('messages')
      .where('id', '=', mutation.data.id)
      .executeTakeFirst();

    if (existingMessage) {
      return true;
    }

    const root = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', mutation.data.rootId)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootNode = mapNode(root);
    const role = extractNodeRole(rootNode, user.id);
    if (!hasCollaboratorAccess(role)) {
      return false;
    }

    const createdMessage = await database
      .insertInto('messages')
      .returningAll()
      .values({
        id: mutation.data.id,
        type: mutation.data.type,
        node_id: mutation.data.nodeId,
        parent_id: mutation.data.parentId,
        root_id: mutation.data.rootId,
        workspace_id: root.workspace_id,
        content: JSON.stringify(mutation.data.content),
        created_by: user.id,
        created_at: new Date(mutation.data.createdAt),
      })
      .executeTakeFirst();

    if (!createdMessage) {
      return false;
    }

    eventBus.publish({
      type: 'message_created',
      messageId: createdMessage.id,
      rootId: createdMessage.root_id,
      workspaceId: createdMessage.workspace_id,
    });

    return true;
  }

  public async createMessageReaction(
    user: SelectUser,
    mutation: CreateMessageReactionMutation
  ): Promise<boolean> {
    const message = await database
      .selectFrom('messages')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.messageId)
      .executeTakeFirst();

    if (!message) {
      return false;
    }

    const root = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', message.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootNode = mapNode(root);
    const role = extractNodeRole(rootNode, user.id);
    if (!hasCollaboratorAccess(role)) {
      return false;
    }

    const createdMessageReaction = await database
      .insertInto('message_reactions')
      .returningAll()
      .values({
        message_id: mutation.data.messageId,
        collaborator_id: user.id,
        reaction: mutation.data.reaction,
        workspace_id: root.workspace_id,
        root_id: root.id,
        created_at: new Date(mutation.data.createdAt),
      })
      .onConflict((b) =>
        b.columns(['message_id', 'collaborator_id', 'reaction']).doUpdateSet({
          created_at: new Date(mutation.data.createdAt),
          deleted_at: null,
        })
      )
      .executeTakeFirst();

    if (!createdMessageReaction) {
      return false;
    }

    eventBus.publish({
      type: 'message_reaction_created',
      messageId: createdMessageReaction.message_id,
      collaboratorId: createdMessageReaction.collaborator_id,
      rootId: createdMessageReaction.root_id,
      workspaceId: createdMessageReaction.workspace_id,
    });

    return true;
  }

  public async deleteMessageReaction(
    user: SelectUser,
    mutation: DeleteMessageReactionMutation
  ): Promise<boolean> {
    const message = await database
      .selectFrom('messages')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.messageId)
      .executeTakeFirst();

    if (!message) {
      return false;
    }

    const root = await database
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', message.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootNode = mapNode(root);
    const role = extractNodeRole(rootNode, user.id);
    if (!hasCollaboratorAccess(role)) {
      return false;
    }

    const deletedMessageReaction = await database
      .updateTable('message_reactions')
      .set({
        deleted_at: new Date(mutation.data.deletedAt),
      })
      .where('message_id', '=', mutation.data.messageId)
      .where('collaborator_id', '=', user.id)
      .where('reaction', '=', mutation.data.reaction)
      .executeTakeFirst();

    if (!deletedMessageReaction) {
      return false;
    }

    eventBus.publish({
      type: 'message_reaction_deleted',
      messageId: mutation.data.messageId,
      collaboratorId: user.id,
      rootId: root.id,
      workspaceId: root.workspace_id,
    });

    return true;
  }
}

export const messageService = new MessageService();
