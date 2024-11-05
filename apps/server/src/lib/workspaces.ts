import { database } from '@/data/database';
import { CreateNode, SelectAccount } from '@/data/schema';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceUserStatus,
} from '@/types/workspaces';
import { generateId, IdType } from '@/lib/id';
import * as Y from 'yjs';
import { fromUint8Array } from 'js-base64';
import { NodeCreatedEvent } from '@/types/events';
import { enqueueEvent } from '@/queues/events';
import { NodeRoles } from './constants';

export const createDefaultWorkspace = async (account: SelectAccount) => {
  const createdAt = new Date();
  const workspaceId = generateId(IdType.Workspace);
  const workspaceName = `${account.name}'s Workspace`;

  const user = buildUserNodeCreate(workspaceId, account);
  const space = buildSpaceNodeCreate(workspaceId, user.id);
  const page = buildPageNodeCreate(workspaceId, space.id, user.id);
  const channel = buildChannelNodeCreate(workspaceId, space.id, user.id);

  const nodesToCreate = [user, space, page, channel];

  await database.transaction().execute(async (trx) => {
    await trx
      .insertInto('workspaces')
      .values({
        id: workspaceId,
        name: workspaceName,
        description: 'Personal workspace for ' + account.name,
        avatar: account.avatar,
        created_at: createdAt,
        created_by: account.id,
        status: WorkspaceStatus.Active,
        version_id: generateId(IdType.Version),
      })
      .execute();

    await trx
      .insertInto('workspace_users')
      .values({
        id: user.id,
        account_id: account.id,
        workspace_id: workspaceId,
        role: WorkspaceRole.Owner,
        created_at: createdAt,
        created_by: account.id,
        status: WorkspaceUserStatus.Active,
        version_id: generateId(IdType.Version),
      })
      .execute();

    await trx.insertInto('nodes').values(nodesToCreate).execute();
  });

  for (const node of nodesToCreate) {
    const event = buildNodeCreateEvent(node);
    await enqueueEvent(event);
  }
};

const buildUserNodeCreate = (
  workspaceId: string,
  account: SelectAccount,
): CreateNode => {
  const id = generateId(IdType.User);
  const versionId = generateId(IdType.Version);
  const doc = new Y.Doc({
    guid: id,
  });

  const attributesMap = doc.getMap('attributes');
  doc.transact(() => {
    attributesMap.set('type', 'user');
    attributesMap.set('name', account.name);
    attributesMap.set('avatar', account.avatar);
    attributesMap.set('email', account.email);
    attributesMap.set('role', WorkspaceRole.Owner);
    attributesMap.set('accountId', account.id);
  });

  const attributes = JSON.stringify(attributesMap.toJSON());
  const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: account.id,
    version_id: versionId,
    server_created_at: new Date(),
    attributes,
    state,
  };
};

const buildSpaceNodeCreate = (
  workspaceId: string,
  userId: string,
): CreateNode => {
  const id = generateId(IdType.Space);
  const versionId = generateId(IdType.Version);
  const doc = new Y.Doc({
    guid: id,
  });

  const attributesMap = doc.getMap('attributes');
  doc.transact(() => {
    attributesMap.set('type', 'space');
    attributesMap.set('name', 'Home');
    attributesMap.set('description', 'Home space');

    attributesMap.set('collaborators', new Y.Map());
    const collaboratorsMap = attributesMap.get(
      'collaborators',
    ) as Y.Map<string>;

    collaboratorsMap.set(userId, NodeRoles.Admin);
  });

  const attributes = JSON.stringify(attributesMap.toJSON());
  const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes,
    state,
  };
};

const buildPageNodeCreate = (
  workspaceId: string,
  spaceId: string,
  userId: string,
): CreateNode => {
  const id = generateId(IdType.Page);
  const versionId = generateId(IdType.Version);
  const doc = new Y.Doc({
    guid: id,
  });

  const attributesMap = doc.getMap('attributes');
  doc.transact(() => {
    attributesMap.set('type', 'page');
    attributesMap.set('name', 'Notes');
    attributesMap.set('parentId', spaceId);
  });

  const attributes = JSON.stringify(attributesMap.toJSON());
  const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes,
    state,
  };
};

const buildChannelNodeCreate = (
  workspaceId: string,
  spaceId: string,
  userId: string,
): CreateNode => {
  const id = generateId(IdType.Channel);
  const versionId = generateId(IdType.Version);
  const doc = new Y.Doc({
    guid: id,
  });

  const attributesMap = doc.getMap('attributes');
  doc.transact(() => {
    attributesMap.set('type', 'channel');
    attributesMap.set('parentId', spaceId);
    attributesMap.set('name', 'Discussions');
  });

  const attributes = JSON.stringify(attributesMap.toJSON());
  const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

  return {
    id,
    workspace_id: workspaceId,
    created_at: new Date(),
    created_by: userId,
    version_id: versionId,
    server_created_at: new Date(),
    attributes,
    state,
  };
};

const buildNodeCreateEvent = (node: CreateNode): NodeCreatedEvent => {
  return {
    type: 'node_created',
    id: node.id,
    workspaceId: node.workspace_id,
    attributes: JSON.parse(node.attributes ?? '{}'),
    createdBy: node.created_by,
    createdAt: node.created_at.toISOString(),
    versionId: node.version_id,
    serverCreatedAt: node.server_created_at.toISOString(),
  };
};
