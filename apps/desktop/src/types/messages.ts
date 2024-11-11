import { JSONContent } from '@tiptap/core';

export type MessageNode = {
  id: string;
  content: JSONContent[];
  createdAt: string;
  author: MessageAuthor;
  reactionCounts: MessageReactionCount[];
  versionId: string;
};

export type MessageReactionCount = {
  reaction: string;
  count: number;
  isReactedTo: boolean;
};

export type MessageAuthor = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};
