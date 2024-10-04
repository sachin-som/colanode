export type SyncLocalChangesInput = {
  workspaceId: string;
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
  table: string;
  action: 'insert' | 'update' | 'delete';
  workspaceId: string;
  before: any | null;
  after: any | null;
};
