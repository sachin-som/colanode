import { MessageContent, MessageType } from '../types/messages';

export type SyncMessagesInput = {
  type: 'messages';
  rootId: string;
};

export type SyncMessageData = {
  id: string;
  type: MessageType;
  parentId: string;
  nodeId: string;
  rootId: string;
  workspaceId: string;
  content: MessageContent;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    messages: {
      input: SyncMessagesInput;
      data: SyncMessageData;
    };
  }
}
