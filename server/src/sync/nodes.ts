import {
  database,
  hasInsertChanges,
  hasUpdateChanges,
  hasDeleteChanges,
} from '@/data/database';
import { SelectWorkspaceUser } from '@/data/schema';
import { fetchCollaboratorRole } from '@/lib/nodes';
import {
  SyncLocalChangeResult,
  LocalChange,
  LocalNodeChangeData,
  ServerNodeCreateChangeData,
  ServerNodeUpdateChangeData,
  ServerNodeDeleteChangeData,
} from '@/types/sync';
import { ServerNodeAttributes } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';
import { generateId, IdType } from '@/lib/id';
import { enqueueChange } from '@/queues/changes';

export const handleNodeChange = async (
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

  const serverCreatedAt = new Date();
  const changeId = generateId(IdType.Change);
  const changeData: ServerNodeCreateChangeData = {
    type: 'node_create',
    id: nodeData.id,
    state: nodeData.state,
    createdAt: nodeData.created_at,
    createdBy: nodeData.created_by,
    serverCreatedAt: serverCreatedAt.toISOString(),
    versionId: nodeData.version_id,
  };

  await database.transaction().execute(async (trx) => {
    const result = await trx
      .insertInto('nodes')
      .values({
        id: nodeData.id,
        attributes: nodeData.attributes,
        workspace_id: workspaceUser.workspace_id,
        state: nodeData.state,
        created_at: new Date(nodeData.created_at),
        created_by: nodeData.created_by,
        version_id: nodeData.version_id,
        server_created_at: serverCreatedAt,
      })
      .execute();

    if (!hasInsertChanges(result)) {
      return;
    }

    await trx
      .insertInto('changes')
      .values({
        id: changeId,
        workspace_id: workspaceUser.workspace_id,
        data: JSON.stringify(changeData),
        created_at: new Date(),
      })
      .execute();
  });

  await enqueueChange(changeId);

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
  const serverUpdatedAt = new Date();

  const doc = new Y.Doc({
    guid: nodeData.id,
  });

  Y.applyUpdate(doc, toUint8Array(existingNode.state));

  const updates: string[] = [];
  doc.on('update', (update) => {
    updates.push(fromUint8Array(update));
  });

  Y.applyUpdate(doc, toUint8Array(nodeData.state));

  const attributesMap = doc.getMap('attributes');
  const attributes = JSON.stringify(attributesMap.toJSON());
  const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

  const changeId = generateId(IdType.Change);
  const changeData: ServerNodeUpdateChangeData = {
    type: 'node_update',
    id: nodeData.id,
    updates: updates,
    updatedAt: updatedAt.toISOString(),
    updatedBy: updatedBy,
    serverUpdatedAt: serverUpdatedAt.toISOString(),
    versionId: nodeData.version_id,
  };

  await database.transaction().execute(async (trx) => {
    const result = await trx
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

    if (!hasUpdateChanges(result)) {
      return;
    }

    await trx
      .insertInto('changes')
      .values({
        id: changeId,
        workspace_id: workspaceUser.workspace_id,
        data: JSON.stringify(changeData),
        created_at: new Date(),
      })
      .execute();
  });

  await enqueueChange(changeId);

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

  const changeId = generateId(IdType.Change);
  const changeData: ServerNodeDeleteChangeData = {
    type: 'node_delete',
    id: nodeData.id,
  };

  await database.transaction().execute(async (trx) => {
    const result = await trx
      .deleteFrom('nodes')
      .where('id', '=', nodeData.id)
      .execute();

    if (!hasDeleteChanges(result)) {
      return;
    }

    await trx
      .insertInto('changes')
      .values({
        id: changeId,
        workspace_id: workspaceUser.workspace_id,
        data: JSON.stringify(changeData),
        created_at: new Date(),
      })
      .execute();
  });

  await enqueueChange(changeId);

  return {
    status: 'success',
  };
};
