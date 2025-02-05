export type SyncNodeReactionsInput = {
  type: 'node_reactions';
  rootId: string;
};

export type SyncNodeReactionData = {
  nodeId: string;
  collaboratorId: string;
  reaction: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  createdAt: string;
  deletedAt: string | null;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    node_reactions: {
      input: SyncNodeReactionsInput;
      data: SyncNodeReactionData;
    };
  }
}
