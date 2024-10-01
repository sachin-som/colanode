import { database } from '@/data/database';
import { SelectWorkspaceAccount } from '@/data/schema';
import { getCollaboratorRole } from '@/lib/nodes';
import {
  ExecuteLocalMutationResult,
  LocalMutation,
  LocalNodeReactionMutationData,
} from '@/types/mutations';

export const handleNodeReactionMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  switch (mutation.action) {
    case 'insert': {
      return handleCreateNodeReactionMutation(workspaceAccount, mutation);
    }
    case 'delete': {
      return handleDeleteNodeReactionMutation(workspaceAccount, mutation);
    }
  }

  return {
    status: 'error',
  };
};

const handleCreateNodeReactionMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  if (!mutation.after) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    mutation.after,
  ) as LocalNodeReactionMutationData;

  if (nodeReactionData.reactor_id !== workspaceAccount.user_id) {
    return {
      status: 'error',
    };
  }

  const nodeRole = await getCollaboratorRole(
    nodeReactionData.node_id,
    workspaceAccount.user_id,
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
      reactor_id: nodeReactionData.reactor_id,
      reaction: nodeReactionData.reaction,
      created_at: new Date(nodeReactionData.created_at),
      workspace_id: workspaceAccount.workspace_id,
      server_created_at: new Date(),
    })
    .onConflict((ob) => ob.doNothing())
    .execute();

  return {
    status: 'success',
  };
};

const handleDeleteNodeReactionMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  if (!mutation.before) {
    return {
      status: 'error',
    };
  }

  const nodeReactionData = JSON.parse(
    mutation.before,
  ) as LocalNodeReactionMutationData;

  if (nodeReactionData.reactor_id !== workspaceAccount.user_id) {
    return {
      status: 'error',
    };
  }

  await database
    .deleteFrom('node_reactions')
    .where((eb) =>
      eb.and([
        eb('node_id', '=', nodeReactionData.node_id),
        eb('reactor_id', '=', nodeReactionData.reactor_id),
        eb('reaction', '=', nodeReactionData.reaction),
      ]),
    )
    .execute();

  return {
    status: 'success',
  };
};
