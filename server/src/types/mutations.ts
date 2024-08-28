export type ExecuteLocalMutationsInput = {
  workspaceId: string;
  mutations: LocalMutation[];
};

export type LocalMutation = {
  id: number;
  table: string;
  action: 'insert' | 'update' | 'delete';
  before?: string | null;
  after?: string | null;
  createdAt: string;
};

export type LocalNodeMutationData = {
  id: string;
  type: string;
  parent_id: string | null;
  index: string | null;
  attrs?: string | null;
  content?: string | null;
  created_at: string;
  updated_at?: string | null;
  created_by: string;
  updated_by?: string | null;
  version_id: string;
  server_created_at: string;
  server_updated_at: string;
  server_version_id: string;
};

export type ServerMutation = {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  workspaceId: string;
  before: any | null;
  after: any | null;
};
