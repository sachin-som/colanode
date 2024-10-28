import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface NodeTable {
  id: ColumnType<string, string, never>;
  parent_id: ColumnType<string | null, never, never>;
  type: ColumnType<string, never, never>;
  index: ColumnType<string | null, never, never>;
  attributes: ColumnType<string, string, string>;
  state: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  created_by: ColumnType<string, string, never>;
  updated_by: ColumnType<string | null, string | null, string | null>;
  version_id: ColumnType<string, string, string>;
  server_created_at: ColumnType<string | null, string | null, string | null>;
  server_updated_at: ColumnType<string | null, string | null, string | null>;
  server_version_id: ColumnType<string | null, string | null, string | null>;
}

export type SelectNode = Selectable<NodeTable>;
export type CreateNode = Insertable<NodeTable>;
export type UpdateNode = Updateable<NodeTable>;

interface NodeUserStateTable {
  node_id: ColumnType<string, string, never>;
  user_id: ColumnType<string, string, never>;
  last_seen_version_id: ColumnType<string | null, string | null, string | null>;
  last_seen_at: ColumnType<string | null, string | null, string | null>;
  mentions_count: ColumnType<number, number, number>;
  version_id: ColumnType<string, string, string>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
}

export type SelectNodeUserState = Selectable<NodeUserStateTable>;
export type CreateNodeUserState = Insertable<NodeUserStateTable>;
export type UpdateNodeUserState = Updateable<NodeUserStateTable>;

interface ChangeTable {
  id: ColumnType<number, never, never>;
  data: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectChange = Selectable<ChangeTable>;
export type CreateChange = Insertable<ChangeTable>;
export type UpdateChange = Updateable<ChangeTable>;

interface UploadTable {
  node_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectUpload = Selectable<UploadTable>;
export type CreateUpload = Insertable<UploadTable>;
export type UpdateUpload = Updateable<UploadTable>;

interface DownloadTable {
  node_id: ColumnType<string, string, never>;
  created_at: ColumnType<string, string, never>;
  updated_at: ColumnType<string | null, string | null, string | null>;
  progress: ColumnType<number, number, number>;
  retry_count: ColumnType<number, number, number>;
}

export type SelectDownload = Selectable<DownloadTable>;
export type CreateDownload = Insertable<DownloadTable>;
export type UpdateDownload = Updateable<DownloadTable>;

export interface WorkspaceDatabaseSchema {
  nodes: NodeTable;
  node_user_states: NodeUserStateTable;
  changes: ChangeTable;
  uploads: UploadTable;
  downloads: DownloadTable;
}
