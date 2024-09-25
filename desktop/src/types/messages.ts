import { LocalNodeWithChildren } from '@/types/nodes';
import { User } from '@/types/users';

export type MessageNode = {
  id: string;
  content: LocalNodeWithChildren[];
  createdAt: string;
  author: User;
  reactionCounts: MessageReactionCount[];
  userReactions: string[];
};

export type MessageReactionCount = {
  reaction: string;
  count: number;
};
