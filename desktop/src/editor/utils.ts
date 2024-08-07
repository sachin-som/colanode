import { Node } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';

export const mapToDocumentContent = (
  parentId: string,
  nodes: Node[],
): JSONContent => {
  const contents: JSONContent[] = [];
  const childrenNodes = nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      } else if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

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
      ...parent.attrs,
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
      const childContent: JSONContent = {
        type: child.type,
        text: child.text,
      };

      if (child.marks && child.marks.length > 0) {
        childContent.marks = child.marks.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        });
      }

      parentContent.content.push(childContent);
    });
  }

  return parentContent;
};
