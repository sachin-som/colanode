export type NodeAttributeDeleteMutationInput = {
  type: 'node_attribute_delete';
  userId: string;
  nodeId: string;
  path: string;
};

export type NodeAttributeDeleteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_attribute_delete: {
      input: NodeAttributeDeleteMutationInput;
      output: NodeAttributeDeleteMutationOutput;
    };
  }
}
