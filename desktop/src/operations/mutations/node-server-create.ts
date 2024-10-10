export type NodeServerCreateMutationInput = {
  type: 'node_server_create';
  accountId: string;
  workspaceId: string;
  id: string;
  state: string;
  createdAt: string;
  createdBy: string;
  versionId: string;
  serverCreatedAt: string;
};

export type NodeServerCreateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_server_create: {
      input: NodeServerCreateMutationInput;
      output: NodeServerCreateMutationOutput;
    };
  }
}
