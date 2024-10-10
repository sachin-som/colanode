export type NodeServerUpdateMutationInput = {
  type: 'node_server_update';
  accountId: string;
  workspaceId: string;
  id: string;
  update: string;
  updatedAt: string;
  updatedBy: string;
  versionId: string;
  serverUpdatedAt: string;
};

export type NodeServerUpdateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_server_update: {
      input: NodeServerUpdateMutationInput;
      output: NodeServerUpdateMutationOutput;
    };
  }
}
