import { ApiError, ColanodeRequest, ColanodeResponse } from '@/types/api';
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
import {
  NodeCreatedEvent,
  NodeDeletedEvent,
  NodeUpdatedEvent,
} from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { synapse } from '@/services/synapse';
import { fetchNodeAncestors, mapNode } from '@/lib/nodes';
import { NodeMutationContext, registry } from '@colanode/core';
import { YDoc } from '@colanode/crdt';

export const syncRouter = Router();

syncRouter.post(
  '/:workspaceId',
  async (req: ColanodeRequest, res: ColanodeResponse) => {
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
  }
);

const handleLocalChange = async (
  workspaceUser: SelectWorkspaceUser,
  change: LocalChange
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
  changeData: LocalCreateNodeChangeData
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

  const ydoc = new YDoc(changeData.id, changeData.state);
  const attributes = ydoc.getAttributes();

  const model = registry.getModel(attributes.type);
  if (!model.schema.safeParse(attributes).success) {
    return {
      status: 'error',
    };
  }

  const ancestorRows = attributes.parentId
    ? await fetchNodeAncestors(attributes.parentId)
    : [];

  const ancestors = ancestorRows.map(mapNode);
  const context = new NodeMutationContext(
    workspaceUser.account_id,
    workspaceUser.workspace_id,
    changeData.createdBy,
    ancestors
  );

  if (!model.canCreate(context, attributes)) {
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
      state: ydoc.getState(),
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
  changeData: LocalUpdateNodeChangeData
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

    const ydoc = new YDoc(changeData.id, existingNode.state);

    for (const update of changeData.updates) {
      ydoc.applyUpdate(update);
    }

    const attributes = ydoc.getAttributes();
    const attributesJson = JSON.stringify(attributes);
    const state = ydoc.getState();

    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return {
        status: 'error',
      };
    }

    const ancestorRows = await fetchNodeAncestors(existingNode.id);
    const ancestors = ancestorRows.map(mapNode);
    const node = ancestors.find((ancestor) => ancestor.id === existingNode.id);
    if (!node) {
      return {
        status: 'error',
      };
    }

    const context = new NodeMutationContext(
      workspaceUser.account_id,
      workspaceUser.workspace_id,
      changeData.updatedBy,
      ancestors
    );

    if (!model.canUpdate(context, node, attributes)) {
      return {
        status: 'error',
      };
    }

    const result = await database
      .updateTable('nodes')
      .set({
        attributes: attributesJson,
        state: state,
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
  changeData: LocalDeleteNodeChangeData
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

  const model = registry.getModel(existingNode.type);
  const ancestorRows = await fetchNodeAncestors(existingNode.id);
  const ancestors = ancestorRows.map(mapNode);
  const node = ancestors.find((ancestor) => ancestor.id === existingNode.id);
  if (!node) {
    return {
      status: 'error',
    };
  }

  const context = new NodeMutationContext(
    workspaceUser.account_id,
    workspaceUser.workspace_id,
    changeData.deletedBy,
    ancestors
  );

  if (!model.canDelete(context, node)) {
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
  changeData: LocalUserNodeChangeData
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
