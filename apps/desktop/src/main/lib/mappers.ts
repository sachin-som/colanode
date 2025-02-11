import { Mutation } from '@colanode/core';

import {
  SelectAccount,
  SelectAppMetadata,
  SelectServer,
} from '@/main/databases/app';
import { SelectEmoji } from '@/main/databases/emojis';
import { SelectIcon } from '@/main/databases/icons';
import { SelectWorkspace } from '@/main/databases/account';
import {
  SelectFile,
  SelectMutation,
  SelectNode,
  SelectUser,
  SelectNodeInteraction,
  SelectNodeReaction,
  SelectWorkspaceMetadata,
} from '@/main/databases/workspace';
import { Account } from '@/shared/types/accounts';
import { Server } from '@/shared/types/servers';
import { User } from '@/shared/types/users';
import { File } from '@/shared/types/files';
import {
  Workspace,
  WorkspaceMetadata,
  WorkspaceMetadataKey,
} from '@/shared/types/workspaces';
import { LocalNode, NodeInteraction, NodeReaction } from '@/shared/types/nodes';
import { Emoji } from '@/shared/types/emojis';
import { Icon } from '@/shared/types/icons';
import { AppMetadata, AppMetadataKey } from '@/shared/types/apps';

export const mapUser = (row: SelectUser): User => {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar,
    customName: row.custom_name,
    customAvatar: row.custom_avatar,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapNode = (row: SelectNode): LocalNode => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    rootId: row.root_id,
    attributes: JSON.parse(row.attributes),
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    localRevision: row.local_revision,
    serverRevision: row.server_revision,
  } as LocalNode;
};

export const mapAccount = (row: SelectAccount): Account => {
  return {
    id: row.id,
    server: row.server,
    name: row.name,
    avatar: row.avatar,
    deviceId: row.device_id,
    email: row.email,
    token: row.token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
};

export const mapWorkspace = (row: SelectWorkspace): Workspace => {
  return {
    id: row.id,
    name: row.name,
    accountId: row.account_id,
    role: row.role,
    userId: row.user_id,
    avatar: row.avatar,
    description: row.description,
    maxFileSize: row.max_file_size,
    storageLimit: row.storage_limit,
  };
};

export const mapMutation = (row: SelectMutation): Mutation => {
  return {
    id: row.id,
    type: row.type,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
  };
};

export const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    syncedAt: row.synced_at ? new Date(row.synced_at) : null,
  };
};

export const mapNodeReaction = (row: SelectNodeReaction): NodeReaction => {
  return {
    nodeId: row.node_id,
    collaboratorId: row.collaborator_id,
    reaction: row.reaction,
    rootId: row.root_id,
    createdAt: row.created_at,
  };
};

export const mapNodeInteraction = (
  row: SelectNodeInteraction
): NodeInteraction => {
  return {
    nodeId: row.node_id,
    collaboratorId: row.collaborator_id,
    rootId: row.root_id,
    revision: row.revision,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    firstOpenedAt: row.first_opened_at,
    lastOpenedAt: row.last_opened_at,
  };
};

export const mapFile = (row: SelectFile): File => {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    rootId: row.root_id,
    revision: row.revision,
    name: row.name,
    originalName: row.original_name,
    extension: row.extension,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    status: row.status,
    downloadStatus: row.download_status,
    downloadProgress: row.download_progress,
    downloadRetries: row.download_retries,
    uploadStatus: row.upload_status,
    uploadProgress: row.upload_progress,
    uploadRetries: row.upload_retries,
  };
};

export const mapEmoji = (row: SelectEmoji): Emoji => {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    categoryId: row.category_id,
    tags: row.tags ? JSON.parse(row.tags) : [],
    emoticons: row.emoticons ? JSON.parse(row.emoticons) : [],
    skins: row.skins ? JSON.parse(row.skins) : [],
  };
};

export const mapIcon = (row: SelectIcon): Icon => {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    code: row.code,
    tags: row.tags ? JSON.parse(row.tags) : [],
  };
};

export const mapAppMetadata = (row: SelectAppMetadata): AppMetadata => {
  return {
    key: row.key as AppMetadataKey,
    value: JSON.parse(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
export const mapWorkspaceMetadata = (
  row: SelectWorkspaceMetadata
): WorkspaceMetadata => {
  return {
    key: row.key as WorkspaceMetadataKey,
    value: JSON.parse(row.value),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
