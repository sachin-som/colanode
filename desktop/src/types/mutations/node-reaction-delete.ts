export type NodeReactionDeleteMutationInput = {
  type: 'node_reaction_delete';
  userId: string;
  nodeId: string;
  reaction: string;
};

export type NodeReactionDeleteMutationOutput = {
  success: boolean;
};

declare module '@/types/mutations' {
  interface MutationMap {
    node_reaction_delete: {
      input: NodeReactionDeleteMutationInput;
      output: NodeReactionDeleteMutationOutput;
    };
  }
}
