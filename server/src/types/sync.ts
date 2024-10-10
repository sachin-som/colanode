export type SyncLocalChangesInput = {
  changes: LocalChange[];
};

export type SyncLocalChangeResult = {
  status: SyncLocalChangeStatus;
};

export type SyncLocalChangeStatus = 'success' | 'error';

export type ServerSyncChangeResult = {
  id: number;
  status: SyncLocalChangeStatus;
};

export type LocalChange = {
  id: number;
  table: string;
  action: 'insert' | 'update' | 'delete';
  before?: string | null;
  after?: string | null;
  createdAt: string;
};

export type LocalNodeChangeData = {
  id: string;
  attributes: string;
  state: string;
  created_at: string;
  updated_at?: string | null;
  created_by: string;
  updated_by?: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string;
  server_version_id: string;
};

export type LocalNodeCollaboratorChangeData = {
  node_id: string;
  collaborator_id: string;
  role: string;
  created_at: string;
  updated_at?: string | null;
  created_by: string;
  updated_by?: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string;
  server_version_id: string;
};

export type LocalNodeReactionChangeData = {
  node_id: string;
  actor_id: string;
  reaction: string;
  created_at: string;
};

export type ServerChange = {
  id: string;
  workspaceId: string;
  deviceId: string;
  data: ServerChangeData;
  createdAt: string;
};

export type ServerChangeData =
  | ServerNodeCreateChangeData
  | ServerNodeUpdateChangeData
  | ServerNodeDeleteChangeData
  | ServerNodeCollaboratorCreateChangeData
  | ServerNodeCollaboratorUpdateChangeData
  | ServerNodeCollaboratorDeleteChangeData
  | ServerNodeReactionCreateChangeData
  | ServerNodeReactionDeleteChangeData;

export type ServerNodeCreateChangeData = {
  type: 'node_create';
  id: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type ServerNodeUpdateChangeData = {
  type: 'node_update';
  id: string;
  workspaceId: string;
  update: string;
  updatedAt: string;
  updatedBy: string;
  versionId: string;
  serverUpdatedAt: string;
};

export type ServerNodeDeleteChangeData = {
  type: 'node_delete';
  id: string;
  workspaceId: string;
};

export type ServerNodeCollaboratorCreateChangeData = {
  type: 'node_collaborator_create';
  nodeId: string;
  collaboratorId: string;
  role: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type ServerNodeCollaboratorUpdateChangeData = {
  type: 'node_collaborator_update';
  nodeId: string;
  collaboratorId: string;
  workspaceId: string;
  role: string;
  updatedAt: string;
  updatedBy: string;
  versionId: string;
  serverUpdatedAt: string;
};

export type ServerNodeCollaboratorDeleteChangeData = {
  type: 'node_collaborator_delete';
  nodeId: string;
  collaboratorId: string;
  workspaceId: string;
};

export type ServerNodeReactionCreateChangeData = {
  type: 'node_reaction_create';
  nodeId: string;
  actorId: string;
  reaction: string;
  workspaceId: string;
  createdAt: string;
  serverCreatedAt: string;
};

export type ServerNodeReactionDeleteChangeData = {
  type: 'node_reaction_delete';
  nodeId: string;
  actorId: string;
  reaction: string;
  workspaceId: string;
};
