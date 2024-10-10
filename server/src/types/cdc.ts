export type CdcMessage<T> = {
  before?: T | null;
  after: T;
  source: CdcSource;
  op: string;
  ts_ms: number;
  ts_ns: number;
  ts_us: number;
  transaction: any;
};

type CdcSource = {
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

export type ChangeCdcData = {
  id: string;
  device_id: string;
  workspace_id: string;
  data: string;
  created_at: string;
};

export type NodeCdcData = {
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

export type NodeCollaboratorCdcData = {
  node_id: string;
  collaborator_id: string;
  role: string;
  workspace_id: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string | null;
};

export type NodeReactionCdcData = {
  node_id: string;
  actor_id: string;
  reaction: string;
  workspace_id: string;
  created_at: string;
  server_created_at: string;
};
