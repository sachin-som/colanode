import { database } from '@/data/database';
import { SelectWorkspaceAccount } from '@/data/schema';
import { getCollaboratorRole } from '@/lib/nodes';
import {
  ExecuteLocalMutationResult,
  LocalMutation,
  LocalNodeMutationData,
} from '@/types/mutations';
import { ServerNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export const handleNodeMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  switch (mutation.action) {
    case 'insert': {
      return handleCreateNodeMutation(workspaceAccount, mutation);
    }
    case 'update': {
      return handleUpdateNodeMutation(workspaceAccount, mutation);
    }
    case 'delete': {
      return handleDeleteNodeMutation(workspaceAccount, mutation);
    }
  }
};

const handleCreateNodeMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  if (!mutation.after) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(mutation.after) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (existingNode) {
    return {
      status: 'success',
    };
  }

  const attributes: ServerNodeAttributes = JSON.parse(nodeData.attributes);
  if (attributes.parentId) {
    const parentRole = await getCollaboratorRole(
      attributes.parentId,
      workspaceAccount.user_id,
    );

    if (
      parentRole === null ||
      (parentRole !== 'owner' && parentRole !== 'admin')
    ) {
      return {
        status: 'error',
      };
    }
  }

  await database
    .insertInto('nodes')
    .values({
      id: nodeData.id,
      attributes: nodeData.attributes,
      workspace_id: workspaceAccount.workspace_id,
      state: nodeData.state,
      created_at: new Date(nodeData.created_at),
      created_by: nodeData.created_by,
      version_id: nodeData.version_id,
      server_created_at: new Date(),
    })
    .execute();

  return {
    status: 'success',
  };
};

const handleUpdateNodeMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  if (!mutation.after) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(mutation.after) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .select(['id', 'workspace_id', 'state'])
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (
    !existingNode ||
    existingNode.workspace_id != workspaceAccount.workspace_id
  ) {
    return {
      status: 'error',
    };
  }

  const role = await getCollaboratorRole(nodeData.id, workspaceAccount.user_id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  const updatedAt = nodeData.updated_at
    ? new Date(nodeData.updated_at)
    : new Date();
  const updatedBy = nodeData.updated_by ?? workspaceAccount.user_id;

  const doc = new Y.Doc({
    guid: nodeData.id,
  });

  Y.applyUpdate(doc, toUint8Array(existingNode.state));
  Y.applyUpdate(doc, toUint8Array(nodeData.state));

  const attributesMap = doc.getMap('attributes');
  const attributes = JSON.stringify(attributesMap.toJSON());
  const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

  await database
    .updateTable('nodes')
    .set({
      attributes: attributes,
      state: encodedState,
      updated_at: updatedAt,
      updated_by: updatedBy,
      version_id: nodeData.version_id,
      server_updated_at: new Date(),
    })
    .where('id', '=', nodeData.id)
    .execute();

  return {
    status: 'success',
  };
};

const handleDeleteNodeMutation = async (
  workspaceAccount: SelectWorkspaceAccount,
  mutation: LocalMutation,
): Promise<ExecuteLocalMutationResult> => {
  if (!mutation.before) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(mutation.before) as LocalNodeMutationData;
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', nodeData.id)
    .select(['id', 'workspace_id'])
    .executeTakeFirst();

  if (!existingNode) {
    return {
      status: 'success',
    };
  }

  if (existingNode.workspace_id !== workspaceAccount.workspace_id) {
    return {
      status: 'error',
    };
  }

  const role = await getCollaboratorRole(nodeData.id, workspaceAccount.user_id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  await database.deleteFrom('nodes').where('id', '=', nodeData.id).execute();
  return {
    status: 'success',
  };
};
