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

export type NodeChangeData = {
  id: string;
  workspace_id: string;
  parent_id?: string | null;
  type: string;
  index: string | null;
  attrs?: string | null;
  content?: string | null;
  created_at: string;
  created_by: string;
  updated_at?: string | null;
  updated_by?: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at?: string | null;
  server_version_id: string;
};

export type UpdateChangeData = {
  id: string;
  workspace_id: string;
  devices: string[];
  type: string;
  content: string;
  created_at: string;
};
