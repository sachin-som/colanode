import { database } from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { getCollaboratorRole } from '@/lib/nodes';
import {
  SyncLocalChangeResult,
  LocalChange,
  LocalNodeReactionChangeData,
} from '@/types/sync';

export const handleNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  mutation: LocalChange,
): Promise<SyncLocalChangeResult> => {
  switch (mutation.action) {
    case 'insert': {
      return handleCreateNodeReactionChange(workspaceUser, mutation);
    }
    case 'delete': {
      return handleDeleteNodeReactionChange(workspaceUser, mutation);
    }
  }

  return {
    status: 'error',
  };
};

const handleCreateNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    change.after,
  ) as LocalNodeReactionChangeData;

  if (nodeReactionData.actor_id !== workspaceUser.id) {
    return {
      status: 'error',
    };
  }

  const nodeRole = await getCollaboratorRole(
    nodeReactionData.node_id,
    workspaceUser.id,
  );

  if (nodeRole === null) {
    return {
      status: 'error',
    };
  }

  await database
    .insertInto('node_reactions')
    .values({
      node_id: nodeReactionData.node_id,
      actor_id: nodeReactionData.actor_id,
      reaction: nodeReactionData.reaction,
      created_at: new Date(nodeReactionData.created_at),
      workspace_id: workspaceUser.workspace_id,
      server_created_at: new Date(),
    })
    .onConflict((ob) => ob.doNothing())
    .execute();

  return {
    status: 'success',
  };
};

const handleDeleteNodeReactionChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.before) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    change.before,
  ) as LocalNodeReactionChangeData;

  if (nodeReactionData.actor_id !== workspaceUser.id) {
    return {
      status: 'error',
    };
  }

  await database
    .deleteFrom('node_reactions')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeReactionData.node_id),
        eb('actor_id', '=', nodeReactionData.actor_id),
        eb('reaction', '=', nodeReactionData.reaction),
      ]),
    )
    .execute();

  return {
    status: 'success',
  };
};
