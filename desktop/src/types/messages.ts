import { Node, NodeWithChildren } from '@/types/nodes';

export type MessageNode = NodeWithChildren & {
  author?: Node | null;
};
