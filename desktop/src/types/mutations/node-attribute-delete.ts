export type NodeAttributeDeleteMutationInput = {
  type: 'node_attribute_delete';
  userId: string;
  nodeId: string;
  attribute: string;
};

export type NodeAttributeDeleteMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    node_attribute_delete: {
      input: NodeAttributeDeleteMutationInput;
      output: NodeAttributeDeleteMutationOutput;
    };
  }
}
