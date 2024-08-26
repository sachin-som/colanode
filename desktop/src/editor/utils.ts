import { Node, NodeBlock } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { EditorNode } from '@/types/editor';
import { LeafNodeTypes } from '@/lib/constants';
import { isEqual } from 'lodash';
import { generateNodeIndex } from '@/lib/nodes';

export const mapNodesToEditorNodes = (nodes: Node[]): EditorNode[] => {
  return nodes.map((node) => mapNodeToEditorNode(node));
};

export const mapNodeToEditorNode = (node: Node): EditorNode => {
  return {
    id: node.id,
    type: node.type,
    parentId: node.parentId,
    attrs: node.attrs,
    content: node.content,
    index: node.index,
  };
};

export const mapEditorNodesToJSONContent = (
  rootId: string,
  editorNodes: EditorNode[],
): JSONContent => {
  const contents: JSONContent[] = [];
  const childrenNodes = editorNodes
    .filter((node) => node.parentId === rootId)
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      } else if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

  for (const child of childrenNodes) {
    const content = mapEditorNodeToJSONContent(child, editorNodes);
    contents.push(content);
  }

  if (!contents.length) {
    contents.push({
      type: 'paragraph',
    });
  }

  return {
    type: 'doc',
    content: contents,
  };
};

const mapEditorNodeToJSONContent = (
  node: EditorNode,
  nodes: EditorNode[],
): JSONContent => {
  const nodeJSONContent: JSONContent = {
    type: node.type,
    attrs: {
      ...node.attrs,
      id: node.id,
      index: node.index,
    },
  };

  const childrenNodes = nodes
    .filter((node) => node.parentId === node.id)
    .sort((a, b) => {
      if (a.index < b.index) {
        return -1;
      } else if (a.index > b.index) {
        return 1;
      }

      return 0;
    });

  if (childrenNodes.length > 0) {
    nodeJSONContent.content = nodeJSONContent.content || [];
    childrenNodes.forEach((child) => {
      nodeJSONContent.content.push(mapEditorNodeToJSONContent(child, nodes));
    });
  }

  if (node.content && node.content.length > 0) {
    nodeJSONContent.content = nodeJSONContent.content || [];
    node.content.forEach((child) => {
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

      nodeJSONContent.content.push(childContent);
    });
  }

  return nodeJSONContent;
};

export const mapJSONContentToEditorNodes = (
  rootId: string,
  content: JSONContent,
): EditorNode[] => {
  const nodes: EditorNode[] = [];
  if (content.content && content.content.length > 0) {
    for (const child of content.content) {
      mapAndPushJSONContentToEditorNode(rootId, child, nodes);
    }
  }
  validateEditorNodeIndexes(nodes);
  return nodes;
};

const mapAndPushJSONContentToEditorNode = (
  parentId: string,
  content: JSONContent,
  editorNodes: EditorNode[],
) => {
  let id = content.attrs?.id;
  if (!id) {
    id = NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));
  }

  const index = content.attrs?.index;
  let attrs = content.attrs ? { ...content.attrs } : null;
  if (attrs) {
    delete attrs.id;
    delete attrs.index;

    if (Object.keys(attrs).length === 0) {
      attrs = null;
    }
  }

  const editorNode: EditorNode = {
    id: id,
    type: content.type,
    parentId: parentId,
    index: index,
    attrs: attrs,
  };
  editorNodes.push(editorNode);

  if (LeafNodeTypes.includes(content.type)) {
    editorNode.content = [];
    for (const child of content.content) {
      const nodeBlock: NodeBlock = {
        type: child.type,
        text: child.text,
      };

      if (child.marks && child.marks.length > 0) {
        nodeBlock.marks = child.marks.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        });
      }

      editorNode.content.push(nodeBlock);
    }

    if (editorNode.content.length === 0) {
      editorNode.content = null;
    }
  } else {
    for (const child of content.content) {
      mapAndPushJSONContentToEditorNode(id, child, editorNodes);
    }
  }
};

const validateEditorNodeIndexes = (editorNodes: EditorNode[]): void => {
  //group by parentId
  const groupedNodes: { [key: string]: EditorNode[] } = {};
  for (const node of editorNodes) {
    if (!groupedNodes[node.parentId]) {
      groupedNodes[node.parentId] = [];
    }

    groupedNodes[node.parentId].push(node);
  }

  for (const parentId in groupedNodes) {
    const nodes = groupedNodes[parentId];
    for (let i = 0; i < nodes.length; i++) {
      const currentIndex = nodes[i].index;
      const beforeIndex = i === 0 ? null : nodes[i - 1].index;

      // find the lowest index after the current node
      // we do this because sometimes nodes can be ordered in such a way that
      // the current node's index is higher than one of its siblings
      // after the next sibling
      // for example:  1, {current}, 4, 3
      let afterIndex = i === nodes.length - 1 ? null : nodes[i + 1].index;
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j].index < afterIndex) {
          afterIndex = nodes[j].index;
          break;
        }
      }

      // extra check to make sure that the beforeIndex is less than the afterIndex
      // because otherwise the fractional index library will throw an error
      if (afterIndex < beforeIndex) {
        afterIndex = generateNodeIndex(null, beforeIndex);
      } else if (beforeIndex === afterIndex) {
        afterIndex = generateNodeIndex(beforeIndex, null);
      }

      if (
        !currentIndex ||
        currentIndex <= beforeIndex ||
        currentIndex > afterIndex
      ) {
        nodes[i].index = generateNodeIndex(beforeIndex, afterIndex);
      }
    }
  }
};

export const editorNodeArrayEquals = (
  a: EditorNode[],
  b: EditorNode[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!deepEquals(a[i], b[i])) {
      return false;
    }
  }

  return true;
};

const deepEquals = (a: any, b: any): boolean => {
  if (a === b) {
    return false;
  }

  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return false;
  }

  return !isEqual(a, b);
};
