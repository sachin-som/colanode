export interface NodesTableSchema {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  type: string;
  attrs: string | null;
  content: string | null;
  created_at: Date;
  updated_at: Date | null;
  created_by: string;
  updated_by: string | null;
  version_id: string;
}

export interface WorkspaceDatabaseSchema {
  nodes: NodesTableSchema;
}