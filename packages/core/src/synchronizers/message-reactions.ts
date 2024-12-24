export type SyncMessageReactionsInput = {
  type: 'message_reactions';
  rootId: string;
};

export type SyncMessageReactionData = {
  messageId: string;
  collaboratorId: string;
  reaction: string;
  rootId: string;
  workspaceId: string;
  createdAt: string;
  deletedAt: string | null;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    message_reactions: {
      input: SyncMessageReactionsInput;
      data: SyncMessageReactionData;
    };
  }
}
