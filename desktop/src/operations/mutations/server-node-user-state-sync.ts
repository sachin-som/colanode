export type ServerNodeUserStateSyncMutationInput = {
  type: 'server_node_user_state_sync';
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

export type ServerNodeUserStateSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    server_node_user_state_sync: {
      input: ServerNodeUserStateSyncMutationInput;
      output: ServerNodeUserStateSyncMutationOutput;
    };
  }
}
