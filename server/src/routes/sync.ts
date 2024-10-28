import * as Y from 'yjs';
import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { database } from '@/data/database';
import { Router } from 'express';
import {
  LocalChange,
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalNodeChangeData,
  LocalNodeUserStateChangeData,
  LocalUpdateNodeChangeData,
  ServerSyncChangeResult,
  SyncLocalChangeResult,
  SyncLocalChangesInput,
} from '@/types/sync';
import { SelectWorkspaceUser } from '@/data/schema';
import { fetchCollaboratorRole } from '@/lib/nodes';
import { ServerNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { synapse } from '@/services/synapse';

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
  const changeData = JSON.parse(change.data) as LocalNodeChangeData;
  switch (changeData.type) {
    case 'node_create': {
      return handleCreateNodeChange(workspaceUser, changeData);
    }
    case 'node_update': {
      return handleUpdateNodeChange(workspaceUser, changeData);
    }
    case 'node_delete': {
      return handleDeleteNodeChange(workspaceUser, changeData);
    }
    case 'node_user_state_update': {
      return handleNodeUserStateChange(workspaceUser, changeData);
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
  changeData: LocalCreateNodeChangeData,
): Promise<SyncLocalChangeResult> => {
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', changeData.id)
    .executeTakeFirst();

  if (existingNode) {
    return {
      status: 'success',
    };
  }

  const doc = new Y.Doc({
    guid: changeData.id,
  });

  Y.applyUpdate(doc, toUint8Array(changeData.state));

  const attributesMap = doc.getMap('attributes');
  const attributes = attributesMap.toJSON() as ServerNodeAttributes;

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
      id: changeData.id,
      attributes: JSON.stringify(attributes),
      workspace_id: workspaceUser.workspace_id,
      state: changeData.state,
      created_at: new Date(changeData.createdAt),
      created_by: changeData.createdBy,
      version_id: changeData.versionId,
      server_created_at: new Date(),
    })
    .execute();

  const event: NodeCreatedEvent = {
    type: 'node_created',
    id: changeData.id,
    workspaceId: workspaceUser.workspace_id,
    attributes: attributes,
    createdBy: changeData.createdBy,
    createdAt: changeData.createdAt,
    serverCreatedAt: new Date().toISOString(),
    versionId: changeData.versionId,
  };

  await enqueueEvent(event);

  return {
    status: 'success',
  };
};

const handleUpdateNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalUpdateNodeChangeData,
): Promise<SyncLocalChangeResult> => {
  const existingNode = await database
    .selectFrom('nodes')
    .select(['id', 'workspace_id', 'attributes', 'state'])
    .where('id', '=', changeData.id)
    .executeTakeFirst();

  if (
    !existingNode ||
    existingNode.workspace_id != workspaceUser.workspace_id
  ) {
    return {
      status: 'error',
    };
  }

  const role = await fetchCollaboratorRole(changeData.id, workspaceUser.id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  const doc = new Y.Doc({
    guid: changeData.id,
  });

  Y.applyUpdate(doc, toUint8Array(existingNode.state));

  for (const update of changeData.updates) {
    Y.applyUpdate(doc, toUint8Array(update));
  }

  const attributesMap = doc.getMap('attributes');
  const attributes = attributesMap.toJSON() as ServerNodeAttributes;
  const attributesJson = JSON.stringify(attributes);
  const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

  await database
    .updateTable('nodes')
    .set({
      attributes: attributesJson,
      state: encodedState,
      updated_at: new Date(changeData.updatedAt),
      updated_by: changeData.updatedBy,
      version_id: changeData.versionId,
      server_updated_at: new Date(),
    })
    .where('id', '=', changeData.id)
    .execute();

  const event: NodeUpdatedEvent = {
    type: 'node_updated',
    id: changeData.id,
    workspaceId: workspaceUser.workspace_id,
    beforeAttributes: existingNode.attributes,
    afterAttributes: attributes,
    updatedBy: changeData.updatedBy,
    updatedAt: changeData.updatedAt,
    serverUpdatedAt: new Date().toISOString(),
    versionId: changeData.versionId,
  };

  await enqueueEvent(event);

  return {
    status: 'success',
  };
};

const handleDeleteNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalDeleteNodeChangeData,
): Promise<SyncLocalChangeResult> => {
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', changeData.id)
    .select(['id', 'workspace_id', 'attributes'])
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

  const role = await fetchCollaboratorRole(changeData.id, workspaceUser.id);
  if (role === null) {
    return {
      status: 'error',
    };
  }

  await database.deleteFrom('nodes').where('id', '=', changeData.id).execute();
  const event: NodeDeletedEvent = {
    type: 'node_deleted',
    id: changeData.id,
    workspaceId: workspaceUser.workspace_id,
    attributes: existingNode.attributes,
    deletedAt: new Date().toISOString(),
  };

  await enqueueEvent(event);

  return {
    status: 'success',
  };
};

const handleNodeUserStateChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalNodeUserStateChangeData,
): Promise<SyncLocalChangeResult> => {
  if (workspaceUser.id !== changeData.userId) {
    return {
      status: 'error',
    };
  }

  await database
    .updateTable('node_user_states')
    .set({
      last_seen_version_id: changeData.lastSeenVersionId,
      last_seen_at: new Date(changeData.lastSeenAt),
      mentions_count: changeData.mentionsCount,
      version_id: changeData.versionId,
      updated_at: new Date(changeData.lastSeenAt),
    })
    .where('node_id', '=', changeData.nodeId)
    .where('user_id', '=', changeData.userId)
    .execute();

  await synapse.sendSynapseMessage({
    type: 'node_user_state_update',
    nodeId: changeData.nodeId,
    userId: changeData.userId,
    workspaceId: workspaceUser.workspace_id,
  });

  return { status: 'success' };
};
