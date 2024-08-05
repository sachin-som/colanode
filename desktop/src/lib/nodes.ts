import { Node, NodeWithChildren } from '@/types/nodes';

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
