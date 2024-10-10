export type NodeServerDeleteMutationInput = {
  type: 'node_server_delete';
  accountId: string;
  workspaceId: string;
  id: string;
};

export type NodeServerDeleteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_server_delete: {
      input: NodeServerDeleteMutationInput;
      output: NodeServerDeleteMutationOutput;
    };
  }
}
