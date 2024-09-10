import { AttributeTypes, EditorNodeTypes, NodeTypes } from '@/lib/constants';
import { NeuronId } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { EditorNode } from '@/types/editor';
import { LocalNodeWithAttributes, NodeBlock } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';

export const mapContentsToEditorNodes = (
  contents: JSONContent[],
  parentId: string,
  nodesMap: Map<string, LocalNodeWithAttributes>,
): EditorNode[] => {
  const editorNodes: EditorNode[] = [];
  mapAndPushContentsToNodes(contents, parentId, editorNodes, nodesMap);
  validateNodesIndexes(editorNodes);
  return editorNodes;
};

const mapAndPushContentsToNodes = (
  contents: JSONContent[] | null | undefined,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  if (!contents) {
    return;
  }

  contents.map((content) => {
    mapAndPushContentToNode(content, parentId, editorNodes, nodesMap);
  });
};

export const mapNodesToContents = (
  parentId: string,
  nodes: LocalNodeWithAttributes[],
): JSONContent[] => {
  const contents: JSONContent[] = [];
  const children = nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => compareString(a.index, b.index));

  for (const child of children) {
    contents.push(mapNodeToContent(child, nodes));
  }
  return contents;
};

const validateNodesIndexes = (editorNodes: EditorNode[]) => {
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

const mapAndPushContentToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  switch (content.type) {
    case EditorNodeTypes.Paragraph:
      mapParagraphToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.Heading1:
      mapHeading1ToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.Heading2:
      mapHeading2ToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.Heading3:
      mapHeading3ToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.BulletList:
      mapBulletListToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.OrderedList:
      mapOrderedListToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.ListItem:
      mapListItemToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.Blockquote:
      mapBlockquoteToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.CodeBlock:
      mapCodeBlockToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.HorizontalRule:
      mapHorizontalRuleToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.TaskList:
      mapTaskListToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.TaskItem:
      mapTaskItemToNode(content, parentId, editorNodes, nodesMap);
      break;
    case EditorNodeTypes.Page:
      mapPageToNode(content, parentId, editorNodes, nodesMap);
      break;
  }
};

const mapNodeToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  switch (node.type) {
    case NodeTypes.Paragraph:
      return mapParagraphToContent(node);
    case NodeTypes.Heading1:
      return mapHeading1ToContent(node);
    case NodeTypes.Heading2:
      return mapHeading2ToContent(node);
    case NodeTypes.Heading3:
      return mapHeading3ToContent(node);
    case NodeTypes.BulletList:
      return mapBulletListToContent(node, nodes);
    case NodeTypes.OrderedList:
      return mapOrderedListToContent(node, nodes);
    case NodeTypes.ListItem:
      return mapListItemToContent(node, nodes);
    case NodeTypes.Blockquote:
      return mapBlockquoteToContent(node, nodes);
    case NodeTypes.CodeBlock:
      return mapCodeBlockToContent(node);
    case NodeTypes.HorizontalRule:
      return mapHorizontalRuleToContent(node);
    case NodeTypes.TaskList:
      return mapTaskListToContent(node, nodes);
    case NodeTypes.TaskItem:
      return mapTaskItemToContent(node, nodes);
    case NodeTypes.Page:
      return mapPageToContent(node);
  }
};

const mapParagraphToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.Paragraph,
    parentId: parentId,
    index: index,
    attributes: [],
    content: mapContentsToNodeBlocks(content.content),
  });
};

const mapParagraphToContent = (node: LocalNodeWithAttributes): JSONContent => {
  return {
    type: EditorNodeTypes.Paragraph,
    attrs: {
      id: node.id,
    },
    content: mapNodeBlocksToContents(node.content),
  };
};

const mapHeading1ToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.Heading1,
    parentId: parentId,
    index: index,
    attributes: [],
    content: mapContentsToNodeBlocks(content.content),
  });
};

const mapHeading1ToContent = (node: LocalNodeWithAttributes): JSONContent => {
  return {
    type: EditorNodeTypes.Heading1,
    attrs: {
      id: node.id,
    },
    content: mapNodeBlocksToContents(node.content),
  };
};

const mapHeading2ToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.Heading2,
    parentId: parentId,
    index: index,
    attributes: [],
    content: mapContentsToNodeBlocks(content.content),
  });
};

const mapHeading2ToContent = (node: LocalNodeWithAttributes): JSONContent => {
  return {
    type: EditorNodeTypes.Heading2,
    attrs: {
      id: node.id,
    },
    content: mapNodeBlocksToContents(node.content),
  };
};

const mapHeading3ToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.Heading3,
    parentId: parentId,
    index: index,
    attributes: [],
    content: mapContentsToNodeBlocks(content.content),
  });
};

const mapHeading3ToContent = (node: LocalNodeWithAttributes): JSONContent => {
  return {
    type: EditorNodeTypes.Heading3,
    attrs: {
      id: node.id,
    },
    content: mapNodeBlocksToContents(node.content),
  };
};

const mapBulletListToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;

  editorNodes.push({
    id: id,
    type: NodeTypes.BulletList,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapBulletListToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  return {
    type: EditorNodeTypes.BulletList,
    attrs: {
      id: node.id,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapOrderedListToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.OrderedList,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapOrderedListToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  return {
    type: EditorNodeTypes.OrderedList,
    attrs: {
      id: node.id,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapListItemToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.ListItem,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapListItemToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  return {
    type: EditorNodeTypes.ListItem,
    attrs: {
      id: node.id,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapBlockquoteToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.Blockquote,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapBlockquoteToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  return {
    type: EditorNodeTypes.Blockquote,
    attrs: {
      id: node.id,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapCodeBlockToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;

  const language = content.attrs?.language;
  editorNodes.push({
    id: id,
    type: NodeTypes.CodeBlock,
    parentId: parentId,
    index: index,
    attributes: [
      {
        nodeId: id,
        type: AttributeTypes.Language,
        key: AttributeTypes.Language,
        numberValue: null,
        textValue: language,
        foreignNodeId: null,
      },
    ],
    content: mapContentsToNodeBlocks(content.content),
  });
};

const mapCodeBlockToContent = (node: LocalNodeWithAttributes): JSONContent => {
  const language = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Language,
  )?.textValue;

  return {
    type: EditorNodeTypes.CodeBlock,
    attrs: {
      id: node.id,
      language: language,
    },
    content: mapNodeBlocksToContents(node.content),
  };
};

const mapHorizontalRuleToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.HorizontalRule,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });
};

const mapHorizontalRuleToContent = (
  node: LocalNodeWithAttributes,
): JSONContent => {
  return {
    type: EditorNodeTypes.HorizontalRule,
    attrs: {
      id: node.id,
    },
    content: null,
  };
};

const mapTaskListToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.TaskList,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapTaskListToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  return {
    type: EditorNodeTypes.TaskList,
    attrs: {
      id: node.id,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapTaskItemToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;
  editorNodes.push({
    id: id,
    type: NodeTypes.TaskItem,
    parentId: parentId,
    index: index,
    attributes: [
      {
        nodeId: id,
        type: AttributeTypes.Checked,
        key: '1',
        numberValue: content.attrs?.checked ? 1 : 0,
        textValue: null,
        foreignNodeId: null,
      },
    ],
    content: null,
  });

  mapAndPushContentsToNodes(content.content, id, editorNodes, nodesMap);
};

const mapTaskItemToContent = (
  node: LocalNodeWithAttributes,
  nodes: LocalNodeWithAttributes[],
): JSONContent => {
  const checkedAttribute = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Checked,
  );

  const checked = checkedAttribute?.numberValue === 1;
  return {
    type: EditorNodeTypes.TaskItem,
    attrs: {
      id: node.id,
      checked: checked,
    },
    content: mapNodesToContents(node.id, nodes),
  };
};

const mapPageToNode = (
  content: JSONContent,
  parentId: string,
  editorNodes: EditorNode[],
  nodesMap: Map<string, LocalNodeWithAttributes>,
): void => {
  const id = getIdFromContent(content);
  const index = nodesMap.get(id)?.index;

  editorNodes.push({
    id: id,
    type: NodeTypes.Page,
    parentId: parentId,
    index: index,
    attributes: [],
    content: null,
  });
};

const mapPageToContent = (node: LocalNodeWithAttributes): JSONContent => {
  const name = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Name,
  )?.textValue;

  const avatar = node.attributes.find(
    (attribute) => attribute.type === AttributeTypes.Avatar,
  )?.textValue;

  return {
    type: EditorNodeTypes.Page,
    attrs: {
      id: node.id,
      name: name,
      avatar: avatar,
    },
    content: null,
  };
};

const getIdFromContent = (content: JSONContent): string => {
  return (
    content.attrs?.id ??
    NeuronId.generate(NeuronId.getIdTypeFromNode(content.type))
  );
};

const mapContentsToNodeBlocks = (
  contents?: JSONContent[],
): NodeBlock[] | null => {
  if (contents == null) {
    return null;
  }

  const nodeBlocks: NodeBlock[] = [];
  for (const content of contents) {
    nodeBlocks.push({
      type: content.type,
      text: content.text,
      marks:
        content.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }) ?? null,
    });
  }

  return nodeBlocks;
};

const mapNodeBlocksToContents = (
  nodeBlocks: NodeBlock[] | null,
): JSONContent[] | null => {
  if (nodeBlocks == null) {
    return null;
  }

  const contents: JSONContent[] = [];
  for (const nodeBlock of nodeBlocks) {
    contents.push({
      type: nodeBlock.type,
      text: nodeBlock.text,
      marks:
        nodeBlock.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }) ?? null,
    });
  }

  return contents;
};
