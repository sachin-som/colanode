import { LocalNodeWithChildren } from '@/types/nodes';
import { UserNode } from '@/types/users';

export type MessageNode = {
  id: string;
  content: LocalNodeWithChildren[];
  createdAt: string;
  author: UserNode;
  reactionCounts: MessageReactionCount[];
  userReactions: string[];
};

export type MessageReactionCount = {
  reaction: string;
  count: number;
};
