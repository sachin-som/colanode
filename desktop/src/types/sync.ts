import {
  ServerNode,
  ServerNodeCollaborator,
  ServerNodeReaction,
} from '@/types/nodes';

export type ServerSyncResponse = {
  results: ServerSyncChangeResult[];
};

export type ServerSyncChangeResult = {
  id: number;
  status: ServerSyncChangeStatus;
};

export type ServerSyncChangeStatus = 'success' | 'error';

export type WorkspaceSyncData = {
  nodes: ServerNode[];
  nodeReactions: ServerNodeReaction[];
  nodeCollaborators: ServerNodeCollaborator[];
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
