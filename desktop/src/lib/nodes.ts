import { Node, NodeContent, NodeTree, NodeContentTree } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';

export const buildNodeTree = (node: Node, allNodes: Node[]): NodeTree => {
  const content: NodeContentTree[] = [];
  if (node.content) {
    content.push(...buildNodeContentTreeRecursive(node.content, allNodes));
  }

  return {
    id: node.id,
    workspaceId: node.workspaceId,
    parentId: node.parentId,
    type: node.type,
    content: content,
    attrs: node.attrs,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    createdBy: node.createdBy,
    updatedBy: node.updatedBy,
    versionId: node.versionId,
  };
};

const buildNodeContentTreeRecursive = (
  content: NodeContent[],
  allNodes: Node[],
): NodeContentTree[] => {
  const childrenContent: NodeContentTree[] = [];
  for (const child of content) {
    if (child.id) {
      const childNode = allNodes.find((n) => n.id === child.id);
      if (childNode) {
        childrenContent.push({
          type: child.type,
          node: buildNodeTree(childNode, allNodes),
        });
      }
    } else {
      childrenContent.push({
        type: child.type,
        text: child.text,
        marks: child.marks,
      });
    }
  }

  return childrenContent;
};

export const buildChildNodes = (parent: Node, content: JSONContent): Node[] => {
  const nodes: Node[] = [];

  if (content.content && content.content.length > 0) {
    for (const child of content.content) {
      buildChildNode(parent, child, nodes);
    }
  }

  return nodes;
};

const buildChildNode = (
  parent: Node,
  content: JSONContent,
  nodes: Node[],
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
    content: [],
    attrs: content.attrs,
    createdAt: new Date(),
    createdBy: parent.createdBy,
    versionId: NeuronId.generate(NeuronId.Type.Version),
  };

  if (!parent.content) {
    parent.content = [];
  }

  parent.content.push({
    type: content.type,
    id: node.id,
  });

  nodes.push(node);

  if (content.content && content.content.length > 0) {
    for (const child of content.content) {
      if (!child.content) {
        const nodeContent: NodeContent = {
          type: child.type,
          text: child.text,
          marks: [],
        };

        if (child.marks) {
          child.marks.forEach((mark) => {
            nodeContent.marks.push({
              type: mark.type,
              attrs: mark.attrs,
            });
          });
        }

        node.content.push(nodeContent);
      } else {
        buildChildNode(node, child, nodes);
      }
    }
  }
};
