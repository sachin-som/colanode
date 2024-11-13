export type NodeReactionCreateMutationInput = {
  type: 'node_reaction_create';
  userId: string;
  nodeId: string;
  reaction: string;
};

export type NodeReactionCreateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    node_reaction_create: {
      input: NodeReactionCreateMutationInput;
      output: NodeReactionCreateMutationOutput;
    };
  }
}
