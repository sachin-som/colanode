import {
  ServerNode,
  ServerNodeCollaborator,
  ServerNodeReaction,
} from '@/types/nodes';

export type ServerChange = {
  id: string;
  table: string;
  action: string;
  workspaceId: string | null;
  before: any | null;
  after: any | null;
};

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
