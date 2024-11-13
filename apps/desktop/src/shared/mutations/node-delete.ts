export type NodeDeleteMutationInput = {
  type: 'node_delete';
  userId: string;
  nodeId: string;
};

export type NodeDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    node_delete: {
      input: NodeDeleteMutationInput;
      output: NodeDeleteMutationOutput;
    };
  }
}
