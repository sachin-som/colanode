import { Node } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';

export const mapToDocumentContent = (
  parentId: string,
  nodes: Node[],
): JSONContent => {
  const contents: JSONContent[] = [];
  const childrenNodes = nodes.filter((node) => node.parentId === parentId);

  for (const child of childrenNodes) {
    const content = mapNodeToEditorContent(child, nodes);
    contents.push(content);
  }

  if (!contents.length) {
    contents.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
        },
      ],
    });
  }

  return {
    type: 'doc',
    content: contents,
  };
};

const mapNodeToEditorContent = (parent: Node, nodes: Node[]): JSONContent => {
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
      parentContent.content.push(mapNodeToEditorContent(child, nodes));
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
