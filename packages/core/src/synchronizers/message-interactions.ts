export type SyncMessageInteractionsInput = {
  type: 'message_interactions';
  rootId: string;
};

export type SyncMessageInteractionData = {
  messageId: string;
  collaboratorId: string;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  rootId: string;
  workspaceId: string;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    message_interactions: {
      input: SyncMessageInteractionsInput;
      data: SyncMessageInteractionData;
    };
  }
}
