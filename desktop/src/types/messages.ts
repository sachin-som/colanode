import { UserNode } from '@/types/users';
import { JSONContent } from '@tiptap/core';

export type MessageNode = {
  id: string;
  content: JSONContent[];
  createdAt: string;
  author: UserNode;
  reactionCounts: MessageReactionCount[];
  versionId: string;
};

export type MessageReactionCount = {
  reaction: string;
  count: number;
  isReactedTo: boolean;
};
