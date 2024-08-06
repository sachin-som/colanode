import { Node, NodeWithChildren } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { generateKeyBetween } from 'fractional-indexing-jittered';
import { Workspace } from '@/types/workspaces';
import { LeafNodeTypes } from '@/lib/constants';

export const mapToEditorContent = (
  parent: Node,
  nodes: Node[],
): JSONContent => {
  const parentContent: JSONContent = {
    type: parent.type,
    attrs: {
      id: parent.id,
      index: parent.index,
    },
  };

  const childrenNodes = nodes
    .filter((node) => node.parentId === parent.id)
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      } else if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

  if (childrenNodes.length > 0) {
    parentContent.content = parentContent.content || [];
    childrenNodes.forEach((child) => {
      parentContent.content.push(mapToEditorContent(child, nodes));
    });
  }

  if (parent.content && parent.content.length > 0) {
    parentContent.content = parentContent.content || [];
    parent.content.forEach((child) => {
      parentContent.content.push({
        type: child.type,
        marks: child.marks,
        text: child.text,
      });
    });
  }

  return parentContent;
};

export const buildNodes = (
  workspace: Workspace,
  parent: Node,
  content: JSONContent[],
  existingNodes: Node[],
): Node[] => {
  const nodes: Node[] = [];
  content.forEach((c) => {
    const nodeWithChildren = buildNodeWithChildren(
      workspace,
      parent,
      c,
      existingNodes,
    );
    enumerateNodes(nodeWithChildren, nodes);
  });

  return nodes;
};

const buildNodeWithChildren = (
  workspace: Workspace,
  parent: Node,
  content: JSONContent,
  existingNodes: Node[],
): NodeWithChildren => {
  const id =
    content.attrs?.id ??
    NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));
  let node = existingNodes.find((n) => n.id === id);
  if (!node) {
    node = {
      id: id,
      workspaceId: workspace.id,
      parentId: parent.id,
      type: content.type,
      index: content.attrs?.index,
      content: [],
      attrs: {
        ...content.attrs,
        id: undefined,
      },
      createdAt: new Date(),
      createdBy: parent.createdBy,
      versionId: NeuronId.generate(NeuronId.Type.Version),
    };
  } else {
    node.attrs = {
      ...content.attrs,
      id: undefined,
    };
  }

  const children: NodeWithChildren[] = [];
  if (isLeafNode(content.type) && content.content) {
    node.content = content.content.map((child) => {
      return {
        type: child.type,
        text: child.text,
        marks: child.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }),
      };
    });
  } else if (content.content && content.content.length > 0) {
    for (let i = 0; i < content.content.length; i++) {
      const childNode = buildNodeWithChildren(
        workspace,
        node,
        content.content[i],
        existingNodes,
      );

      const beforeIndex = i === 0 ? null : content.content[i - 1].index;
      const afterIndex =
        i === content.content.length - 1 ? null : content.content[i + 1].index;
      const currentIndex = childNode.index;

      if (
        currentIndex == null ||
        currentIndex < beforeIndex ||
        currentIndex > afterIndex
      ) {
        childNode.index = generateKeyBetween(beforeIndex, afterIndex);
      }
    }
  }

  return {
    ...node,
    children,
  };
};

export const enumerateNodes = (
  nodeWithChildren: NodeWithChildren,
  nodes: Node[],
) => {
  nodes.push(nodeWithChildren);
  nodeWithChildren.children.forEach((child) => {
    enumerateNodes(child, nodes);
  });
};

const isLeafNode = (type: string) => {
  return LeafNodeTypes.includes(type);
};
