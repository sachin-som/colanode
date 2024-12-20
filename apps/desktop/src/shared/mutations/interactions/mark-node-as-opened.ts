export type MarkNodeAsOpenedMutationInput = {
  type: 'mark_node_as_opened';
  userId: string;
  nodeId: string;
  transactionId: string;
};

export type MarkNodeAsOpenedMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    mark_node_as_opened: {
      input: MarkNodeAsOpenedMutationInput;
      output: MarkNodeAsOpenedMutationOutput;
    };
  }
}
