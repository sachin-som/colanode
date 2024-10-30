import * as Y from 'yjs';
import { ApiError, NeuronRequest, NeuronResponse } from '@/types/api';
import { database, hasUpdateChanges } from '@/data/database';
import { Router } from 'express';
import {
  LocalChange,
  LocalCreateNodeChangeData,
  LocalDeleteNodeChangeData,
  LocalNodeChangeData,
  LocalUpdateNodeChangeData,
  LocalUserNodeChangeData,
  ServerSyncChangeResult,
  SyncLocalChangeResult,
  SyncLocalChangesInput,
} from '@/types/sync';
import { SelectWorkspaceUser } from '@/data/schema';
import { ServerNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { synapse } from '@/services/synapse';
import { getValidator } from '@/validators';
import { mapNode } from '@/lib/nodes';

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

    const workspaceUser = await database
      .selectFrom('workspace_users')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
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
    case 'user_node_update': {
      return handleUserNodeStateChange(workspaceUser, changeData);
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

  const validator = getValidator(attributes.type);
  if (!validator) {
    return {
      status: 'error',
    };
  }

  if (!(await validator.canCreate(workspaceUser, attributes))) {
    return {
      status: 'error',
    };
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
  let count = 0;
  while (count++ < 10) {
    const existingNode = await database
      .selectFrom('nodes')
      .selectAll()
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

    const validator = getValidator(existingNode.type);
    if (!validator) {
      return {
        status: 'error',
      };
    }

    if (
      !(await validator.canUpdate(
        workspaceUser,
        mapNode(existingNode),
        attributes,
      ))
    ) {
      return {
        status: 'error',
      };
    }

    const result = await database
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
      .where('version_id', '=', existingNode.version_id)
      .execute();

    if (hasUpdateChanges(result)) {
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
    }
  }

  return {
    status: 'error',
  };
};

const handleDeleteNodeChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalDeleteNodeChangeData,
): Promise<SyncLocalChangeResult> => {
  const existingNode = await database
    .selectFrom('nodes')
    .where('id', '=', changeData.id)
    .selectAll()
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

  const validator = getValidator(existingNode.type);
  if (!validator) {
    return {
      status: 'error',
    };
  }

  if (!(await validator.canDelete(workspaceUser, mapNode(existingNode)))) {
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

const handleUserNodeStateChange = async (
  workspaceUser: SelectWorkspaceUser,
  changeData: LocalUserNodeChangeData,
): Promise<SyncLocalChangeResult> => {
  if (workspaceUser.id !== changeData.userId) {
    return {
      status: 'error',
    };
  }

  await database
    .updateTable('user_nodes')
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
    type: 'user_node_update',
    nodeId: changeData.nodeId,
    userId: changeData.userId,
    workspaceId: workspaceUser.workspace_id,
  });

  return { status: 'success' };
};
