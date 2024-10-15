import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import {
  LocalChange,
  LocalNodeChangeData,
  ServerSyncChangeResult,
  SyncLocalChangeResult,
  SyncLocalChangesInput,
} from '@/types/sync';
import { SelectWorkspaceUser } from '@/data/schema';
import { fetchCollaboratorRole } from '@/lib/nodes';
import { ServerNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';
import { CHANNEL_NAMES, redis } from '@/data/redis';

export const syncRouter = Router();

syncRouter.post(
  '/:workspaceId',
  async (req: NeuronRequest, res: NeuronResponse) => {
    const workspaceId = req.params.workspaceId as string;
    const input = req.body as SyncLocalChangesInput;
    if (!req.account) {
      return res.status(401).json({
        code: ApiError.Unauthorized,
        message: 'Unauthorized.',
      });
    }

    const workspace = await database
      .selectFrom('workspaces')
      .selectAll()
      .where('id', '=', workspaceId)
      .executeTakeFirst();

    if (!workspace) {
      return res.status(404).json({
        code: ApiError.ResourceNotFound,
        message: 'Workspace not found.',
      });
    }

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('account_id', '=', req.account.id)
      .executeTakeFirst();

    if (!workspaceUser) {
      return res.status(403).json({
        code: ApiError.Forbidden,
        message: 'Forbidden.',
      });
    }

    const results: ServerSyncChangeResult[] = [];
    for (const change of input.changes) {
      try {
        const result = await handleLocalChange(workspaceUser, change);
        results.push({
          id: change.id,
          status: result.status,
        });
      } catch (error) {
        console.error('Error handling local change', error);
        results.push({
          id: change.id,
          status: 'error',
        });
      }
    }

    console.log('executed mutations', results);
    res.status(200).json({ results });
  },
);

const handleLocalChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  switch (change.action) {
    case 'insert': {
      return handleCreateNodeChange(workspaceUser, change);
    }
    case 'update': {
      return handleUpdateNodeChange(workspaceUser, change);
    }
    case 'delete': {
      return handleDeleteNodeChange(workspaceUser, change);
    }
    default: {
      return {
        status: 'error',
      };
    }
  }
};

const handleCreateNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(change.after) as LocalNodeChangeData;
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
    const parentRole = await fetchCollaboratorRole(
      attributes.parentId,
      workspaceUser.id,
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
      workspace_id: workspaceUser.workspace_id,
      state: nodeData.state,
      created_at: new Date(nodeData.created_at),
      created_by: nodeData.created_by,
      version_id: nodeData.version_id,
      server_created_at: new Date(),
    })
    .execute();

  await publishChange(nodeData.id, workspaceUser.workspace_id);

  return {
    status: 'success',
  };
};

const handleUpdateNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.after) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(change.after) as LocalNodeChangeData;
  const existingNode = await database
    .selectFrom('nodes')
    .select(['id', 'workspace_id', 'state'])
    .where('id', '=', nodeData.id)
    .executeTakeFirst();

  if (
    !existingNode ||
    existingNode.workspace_id != workspaceUser.workspace_id
  ) {
    return {
      status: 'error',
    };
  }

  const role = await fetchCollaboratorRole(nodeData.id, workspaceUser.id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  const updatedAt = nodeData.updated_at
    ? new Date(nodeData.updated_at)
    : new Date();
  const updatedBy = nodeData.updated_by ?? workspaceUser.id;

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

  await publishChange(nodeData.id, workspaceUser.workspace_id);

  return {
    status: 'success',
  };
};

const handleDeleteNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange,
): Promise<SyncLocalChangeResult> => {
  if (!change.before) {
    return {
      status: 'error',
    };
  }

  const nodeData = JSON.parse(change.before) as LocalNodeChangeData;
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

  if (existingNode.workspace_id !== workspaceUser.workspace_id) {
    return {
      status: 'error',
    };
  }

  const role = await fetchCollaboratorRole(nodeData.id, workspaceUser.id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  await database
    .updateTable('nodes')
    .set({
      deleted_at: new Date(),
      deleted_by: workspaceUser.id,
      version_id: nodeData.version_id,
      server_deleted_at: new Date(),
    })
    .where('id', '=', nodeData.id)
    .execute();

  await publishChange(nodeData.id, workspaceUser.workspace_id);

  return {
    status: 'success',
  };
};

const publishChange = async (nodeId: string, workspaceId: string) => {
  const changeJson = JSON.stringify({
    nodeId,
    workspaceId,
  });

  await redis.publish(CHANNEL_NAMES.CHANGES, changeJson);
};
