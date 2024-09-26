export type ChangeMessage<T> = {
  before?: T | null;
  after: T;
  source: ChangeSource;
  op: string;
  ts_ms: number;
  ts_ns: number;
  ts_us: number;
  transaction: any;
};

type ChangeSource = {
  version: string;
  connector: string;
  name: string;
  ts_ms: number;
  snapshot: string;
  db: string;
  sequence: string;
  ts_us: number;
  ts_ns: number;
  schema: string;
  table: string;
  txId: number;
  lsn: number;
};

export type MutationChangeData = {
  id: string;
  workspace_id: string;
  table: string;
  action: string;
  after: string | null;
  before: string | null;
  created_at: string;
  device_ids: string[];
};

export type NodeChangeData = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: string;
  index: string | null;
  attributes: string;
  state: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string | null;
};

export type NodePermissionChangeData = {
  node_id: string;
  collaborator_id: string;
  permission: string;
  workspace_id: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string | null;
};

export type NodeReactionChangeData = {
  node_id: string;
  reactor_id: string;
  reaction: string;
  workspace_id: string;
  created_at: string;
  server_created_at: string;
};
