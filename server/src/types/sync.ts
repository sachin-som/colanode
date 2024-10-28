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

export type LocalNodeUserStateChangeData = {
  type: 'node_user_state_update';
  nodeId: string;
  userId: string;
  lastSeenVersionId: string;
  lastSeenAt: string;
  mentionsCount: number;
  versionId: string;
};

export type LocalNodeChangeData =
  | LocalCreateNodeChangeData
  | LocalUpdateNodeChangeData
  | LocalDeleteNodeChangeData
  | LocalNodeUserStateChangeData;
