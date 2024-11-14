export type SyncChangesInput = {
  changes: LocalChange[];
};

export type SyncChangesOutput = {
  results: SyncChangeResult[];
};

export type SyncChangeStatus = 'success' | 'error';

export type SyncChangeResult = {
  id: number;
  status: SyncChangeStatus;
};

export type LocalChange = {
  id: number;
  data: LocalChangeData;
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

export type LocalUserNodeChangeData = {
  type: 'user_node_update';
  nodeId: string;
  userId: string;
  lastSeenVersionId: string;
  lastSeenAt: string;
  mentionsCount: number;
  versionId: string;
};

export type LocalChangeData =
  | LocalCreateNodeChangeData
  | LocalUpdateNodeChangeData
  | LocalDeleteNodeChangeData
  | LocalUserNodeChangeData;
