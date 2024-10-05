export type NodeAttributeSetMutationInput = {
  type: 'node_attribute_set';
  userId: string;
  nodeId: string;
  attribute: string;
  value: any;
};

export type NodeAttributeSetMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_attribute_set: {
      input: NodeAttributeSetMutationInput;
      output: NodeAttributeSetMutationOutput;
    };
  }
}
