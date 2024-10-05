export type NodeReactionSyncMutationInput = {
  type: 'node_reaction_sync';
  accountId: string;
  workspaceId: string;
  id: string;
  action: string;
  before: any;
  after: any;
};

export type NodeReactionSyncMutationOutput = {
  success: boolean;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    node_reaction_sync: {
      input: NodeReactionSyncMutationInput;
      output: NodeReactionSyncMutationOutput;
    };
  }
}
