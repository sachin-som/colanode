export type NodeReactionServerDeleteMutationInput = {
  type: 'node_reaction_server_delete';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  actorId: string;
  reaction: string;
};

export type NodeReactionServerDeleteMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_reaction_server_delete: {
      input: NodeReactionServerDeleteMutationInput;
      output: NodeReactionServerDeleteMutationOutput;
    };
  }
}
