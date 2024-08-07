import { Node, NodeWithChildren } from '@/types/nodes';
import { generateKeyBetween } from 'fractional-indexing-jittered';

export const buildNodeWithChildren = (
  node: Node,
  allNodes: Node[],
): NodeWithChildren => {
  const children: NodeWithChildren[] = allNodes
    .filter((n) => n.parentId === node.id)
    .map((n) => buildNodeWithChildren(n, allNodes));

  return {
    ...node,
    children: children,
  };
};

export const generateNodeIndex = (before?: string | null, after?: string | null) => {
  const lower = before === undefined ? null : before;
  const upper = after === undefined ? null : after;

  return generateKeyBetween(lower, upper);
}