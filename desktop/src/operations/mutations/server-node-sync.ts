export type ServerNodeSyncMutationInput = {
  type: 'server_node_sync';
  accountId: string;
  id: string;
  workspaceId: string;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  serverCreatedAt: string;
  serverUpdatedAt: string | null;
  versionId: string;
};

export type ServerNodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    server_node_sync: {
      input: ServerNodeSyncMutationInput;
      output: ServerNodeSyncMutationOutput;
    };
  }
}
