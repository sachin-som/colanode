import { LocalNode, LocalNodeWithChildren } from '@/types/nodes';

export type MessageNode = LocalNodeWithChildren & {
  author?: LocalNode | null;
};
