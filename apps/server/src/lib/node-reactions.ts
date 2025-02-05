import {
  canCreateNodeReaction,
  canDeleteNodeReaction,
  CreateNodeReactionMutation,
  DeleteNodeReactionMutation,
} from '@colanode/core';

import { eventBus } from '@/lib/event-bus';
import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { mapNode } from '@/lib/nodes';

export const createNodeReaction = async (
  user: SelectUser,
  mutation: CreateNodeReactionMutation
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', mutation.data.nodeId)
    .executeTakeFirst();

  if (!node) {
    return false;
  }

  const root = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', node.root_id)
    .executeTakeFirst();

  if (!root) {
    return false;
  }

  if (
    !canCreateNodeReaction({
      user: {
        userId: user.id,
        role: user.role,
      },
      root: mapNode(root),
      node: mapNode(node),
    })
  ) {
    return false;
  }

  const createdNodeReaction = await database
    .insertInto('node_reactions')
    .returningAll()
    .values({
      node_id: mutation.data.nodeId,
      collaborator_id: user.id,
      reaction: mutation.data.reaction,
      workspace_id: root.workspace_id,
      root_id: root.id,
      created_at: new Date(mutation.data.createdAt),
    })
    .onConflict((b) =>
      b.columns(['node_id', 'collaborator_id', 'reaction']).doUpdateSet({
        created_at: new Date(mutation.data.createdAt),
        deleted_at: null,
      })
    )
    .executeTakeFirst();

  if (!createdNodeReaction) {
    return false;
  }

  eventBus.publish({
    type: 'node_reaction_created',
    nodeId: createdNodeReaction.node_id,
    collaboratorId: createdNodeReaction.collaborator_id,
    rootId: createdNodeReaction.root_id,
    workspaceId: createdNodeReaction.workspace_id,
  });

  return true;
};

export const deleteNodeReaction = async (
  user: SelectUser,
  mutation: DeleteNodeReactionMutation
): Promise<boolean> => {
  const node = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', mutation.data.nodeId)
    .executeTakeFirst();

  if (!node) {
    return false;
  }

  const root = await database
    .selectFrom('nodes')
    .selectAll()
    .where('id', '=', node.root_id)
    .executeTakeFirst();

  if (!root) {
    return false;
  }

  if (
    !canDeleteNodeReaction({
      user: {
        userId: user.id,
        role: user.role,
      },
      root: mapNode(root),
      node: mapNode(node),
    })
  ) {
    return false;
  }

  const deletedNodeReaction = await database
    .updateTable('node_reactions')
    .set({
      deleted_at: new Date(mutation.data.deletedAt),
    })
    .where('node_id', '=', mutation.data.nodeId)
    .where('collaborator_id', '=', user.id)
    .where('reaction', '=', mutation.data.reaction)
    .executeTakeFirst();

  if (!deletedNodeReaction) {
    return false;
  }

  eventBus.publish({
    type: 'node_reaction_deleted',
    nodeId: mutation.data.nodeId,
    collaboratorId: user.id,
    rootId: node.root_id,
    workspaceId: node.workspace_id,
  });

  return true;
};
