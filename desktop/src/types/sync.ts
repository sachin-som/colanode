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
  | ServerNodeReactionDeleteChangeData
  | ServerNodeBatchSyncChangeData;

export type ServerNodeCreateChangeData = {
  type: 'node_create';
  id: string;
  state: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type ServerNodeUpdateChangeData = {
  type: 'node_update';
  id: string;
  update: string;
  updatedAt: string;
  updatedBy: string;
  versionId: string;
  serverUpdatedAt: string;
};

export type ServerNodeDeleteChangeData = {
  type: 'node_delete';
  id: string;
};

export type ServerNodeCollaboratorCreateChangeData = {
  type: 'node_collaborator_create';
  nodeId: string;
  collaboratorId: string;
  role: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type ServerNodeCollaboratorUpdateChangeData = {
  type: 'node_collaborator_update';
  nodeId: string;
  collaboratorId: string;
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
};

export type ServerNodeReactionCreateChangeData = {
  type: 'node_reaction_create';
  nodeId: string;
  actorId: string;
  reaction: string;
  createdAt: string;
  serverCreatedAt: string;
};

export type ServerNodeReactionDeleteChangeData = {
  type: 'node_reaction_delete';
  nodeId: string;
  actorId: string;
  reaction: string;
};

export type ServerNodeBatchSyncChangeData = {
  type: 'node_batch_sync';
  nodes: ServerNodeBatchSyncData[];
};

export type ServerNodeBatchSyncData = {
  id: string;
  state: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
};
