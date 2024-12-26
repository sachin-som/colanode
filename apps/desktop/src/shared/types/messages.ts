import { MessageContent, MessageType } from '@colanode/core';

export type MessageNode = {
  id: string;
  type: MessageType;
  parentId: string;
  rootId: string;
  content: MessageContent;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  version: bigint;
};

export type MessageReaction = {
  messageId: string;
  collaboratorId: string;
  rootId: string;
  reaction: string;
  createdAt: string;
};

export type MessageReactionsCount = {
  reaction: string;
  count: number;
  reacted: boolean;
};

export type MessageInteraction = {
  messageId: string;
  collaboratorId: string;
  rootId: string;
  seenAt: string | null;
  lastOpenedAt: string | null;
  version: bigint;
};
