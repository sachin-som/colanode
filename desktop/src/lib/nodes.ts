import { Node, NodeWithChildren, NodeBlock } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
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

export const buildChildNodes = (parent: Node, content: JSONContent): Node[] => {
  const nodes: Node[] = [];

  if (content.content && content.content.length > 0) {
    let index: string | null = null;
    for (const child of content.content) {
      index = generateKeyBetween(index, null);
      buildChildNode(parent, child, nodes, index);
    }
  }

  return nodes;
};

const buildChildNode = (
  parent: Node,
  content: JSONContent,
  nodes: Node[],
  index?: string | null,
): void => {
  let id = content.attrs.id;
  if (id) {
    delete content.attrs.id;
  } else {
    id = NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));
  }

  const node: Node = {
    id: id,
    workspaceId: parent.workspaceId,
    parentId: parent.id,
    type: content.type,
    index: index,
    content: [],
    attrs: content.attrs,
    createdAt: new Date(),
    createdBy: parent.createdBy,
    versionId: NeuronId.generate(NeuronId.Type.Version),
  };

  nodes.push(node);

  if (content.content && content.content.length > 0) {
    let index = null;
    for (const child of content.content) {
      if (isNodeBlock(child)) {
        const nodeBlock: NodeBlock = {
          type: child.type,
          text: child.text,
          marks: [],
        };

        if (child.marks) {
          child.marks.forEach((mark) => {
            nodeBlock.marks.push({
              type: mark.type,
              attrs: mark.attrs,
            });
          });
        }

        node.content.push(nodeBlock);
      } else {
        index = generateKeyBetween(index, null);
        buildChildNode(node, child, nodes, index);
      }
    }
  }
};

const isNodeBlock = (content: JSONContent): boolean => {
  return content.type === 'text';
};
