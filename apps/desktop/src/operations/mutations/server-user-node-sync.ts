export type ServerUserNodeSyncMutationInput = {
  type: 'server_user_node_sync';
  accountId: string;
  nodeId: string;
  userId: string;
  workspaceId: string;
  versionId: string;
  lastSeenAt: string | null;
  lastSeenVersionId: string | null;
  mentionsCount: number;
  createdAt: string;
  updatedAt: string | null;
};

export type ServerUserNodeSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    server_user_node_sync: {
      input: ServerUserNodeSyncMutationInput;
      output: ServerUserNodeSyncMutationOutput;
    };
  }
}
