export type ServerSyncResponse = {
  results: ServerSyncChangeResult[];
};

export type ServerSyncChangeResult = {
  id: number;
  status: ServerSyncChangeStatus;
};

export type ServerSyncChangeStatus = 'success' | 'error';

export type ServerNodeSyncData = {
  id: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  updatedAt?: string | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedAt?: string | null;
  deletedBy?: string | null;
  versionId: string;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
  serverDeletedAt?: string | null;
};

export type LocalCreateNodeChangeData = {
  type: 'node_create';
  id: string;
  state: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
};

export type LocalUpdateNodeChangeData = {
  type: 'node_update';
  id: string;
  updates: string[];
  updatedAt: string;
  updatedBy: string;
  versionId: string;
};

export type LocalDeleteNodeChangeData = {
  type: 'node_delete';
  id: string;
  deletedAt: string;
  deletedBy: string;
};

export type LocalNodeChangeData =
  | LocalCreateNodeChangeData
  | LocalUpdateNodeChangeData
  | LocalDeleteNodeChangeData;
