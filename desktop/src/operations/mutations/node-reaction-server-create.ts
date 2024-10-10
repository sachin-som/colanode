export type NodeReactionServerCreateMutationInput = {
  type: 'node_reaction_server_create';
  accountId: string;
  workspaceId: string;
  nodeId: string;
  actorId: string;
  reaction: string;
  createdAt: string;
  serverCreatedAt: string;
};

export type NodeReactionServerCreateMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_reaction_server_create: {
      input: NodeReactionServerCreateMutationInput;
      output: NodeReactionServerCreateMutationOutput;
    };
  }
}
