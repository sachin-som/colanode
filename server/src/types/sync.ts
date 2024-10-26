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
  data: string;
  createdAt: string;
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

export type ServerNodeChangeEvent = {
  workspaceId: string;
  nodeId: string;
  type: 'node_create' | 'node_update' | 'node_delete';
};
