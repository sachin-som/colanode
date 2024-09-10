import { LocalNodeWithAttributesAndChildren } from '@/types/nodes';
import { User } from '@/types/users';

export type MessageNode = {
  id: string;
  content: LocalNodeWithAttributesAndChildren[];
  createdAt: string;
  author: User;
};
