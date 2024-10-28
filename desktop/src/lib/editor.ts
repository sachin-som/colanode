import { EditorNodeTypes } from '@/lib/constants';
import { generateId, getIdTypeFromNode } from '@/lib/id';
import { generateNodeIndex } from '@/lib/nodes';
import { compareString } from '@/lib/utils';
import { NodeBlock, NodeBlockContent } from '@/types/nodes';
import { JSONContent } from '@tiptap/core';
import { isEqual } from 'lodash';
import * as Y from 'yjs';
import { diffChars } from 'diff';

const leafBlockTypes = new Set([
  EditorNodeTypes.Paragraph,
  EditorNodeTypes.Heading1,
  EditorNodeTypes.Heading2,
  EditorNodeTypes.Heading3,
  EditorNodeTypes.HorizontalRule,
  EditorNodeTypes.CodeBlock,
]);

export const mapContentsToBlocks = (
  parentId: string,
  contents: JSONContent[],
  blocksMap: Map<string, NodeBlock>,
): NodeBlock[] => {
  const blocks: NodeBlock[] = [];
  mapAndPushContentsToBlocks(contents, parentId, blocks, blocksMap);
  validateBlocksIndexes(blocks);
  return blocks;
};

const mapAndPushContentsToBlocks = (
  contents: JSONContent[] | null | undefined,
  parentId: string,
  blocks: NodeBlock[],
  blocksMap: Map<string, NodeBlock>,
): void => {
  if (!contents) {
    return;
  }
  contents.map((content) => {
    mapAndPushContentToBlock(content, parentId, blocks, blocksMap);
  });
};

const mapAndPushContentToBlock = (
  content: JSONContent,
  parentId: string,
  blocks: NodeBlock[],
  blocksMap: Map<string, NodeBlock>,
): void => {
  const id = getIdFromContent(content);
  const index = blocksMap.get(id)?.index;
  const attrs =
    (content.attrs &&
      Object.entries(content.attrs).filter(([key]) => key !== 'id')) ??
    [];

  const isLeafBlock = leafBlockTypes.has(content.type);
  const blockContent = isLeafBlock
    ? mapContentsToNodeBlockContents(content.type, content.content)
    : null;

  blocks.push({
    id: id,
    index: index,
    attrs: attrs.length > 0 ? Object.fromEntries(attrs) : null,
    parentId: parentId,
    type: content.type,
    content: blockContent,
  });

  if (!isLeafBlock && content.content) {
    mapAndPushContentsToBlocks(content.content, id, blocks, blocksMap);
  }
};

const mapContentsToNodeBlockContents = (
  type: string,
  contents?: JSONContent[],
): NodeBlockContent[] | null => {
  if (!leafBlockTypes.has(type) || contents == null) {
    return null;
  }

  const nodeBlocks: NodeBlockContent[] = [];
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

export const mapBlocksToContents = (
  parentId: string,
  blocks: NodeBlock[],
): JSONContent[] => {
  const contents: JSONContent[] = [];
  const children = blocks
    .filter((block) => block.parentId === parentId)
    .sort((a, b) => compareString(a.index, b.index));

  for (const child of children) {
    contents.push(mapBlockToContent(child, blocks));
  }

  return contents;
};

const mapBlockToContent = (
  block: NodeBlock,
  blocks: NodeBlock[],
): JSONContent => {
  return {
    type: block.type,
    attrs: {
      id: block.id,
      ...block.attrs,
    },
    content: leafBlockTypes.has(block.type)
      ? mapNodeBlockContentsToContents(block.content)
      : mapBlocksToContents(block.id, blocks),
  };
};

const mapNodeBlockContentsToContents = (
  nodeBlocks: NodeBlockContent[] | null,
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

const validateBlocksIndexes = (blocks: NodeBlock[]) => {
  //group by parentId
  const groupedBlocks: { [key: string]: NodeBlock[] } = {};
  for (const block of blocks) {
    if (!groupedBlocks[block.parentId]) {
      groupedBlocks[block.parentId] = [];
    }
    groupedBlocks[block.parentId].push(block);
  }
  for (const parentId in groupedBlocks) {
    const blocks = groupedBlocks[parentId];
    for (let i = 0; i < blocks.length; i++) {
      const currentIndex = blocks[i].index;
      const beforeIndex = i === 0 ? null : blocks[i - 1].index;
      // find the lowest index after the current node
      // we do this because sometimes nodes can be ordered in such a way that
      // the current node's index is higher than one of its siblings
      // after the next sibling
      // for example:  1, {current}, 4, 3
      let afterIndex = i === blocks.length - 1 ? null : blocks[i + 1].index;
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[j].index < afterIndex) {
          afterIndex = blocks[j].index;
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
        blocks[i].index = generateNodeIndex(beforeIndex, afterIndex);
      }
    }
  }
};

const getIdFromContent = (content: JSONContent): string => {
  return content.attrs?.id ?? generateId(getIdTypeFromNode(content.type));
};

export const applyChangeToYDoc = (doc: Y.Doc, blocks: NodeBlock[]) => {
  const attributesMap = doc.getMap('attributes');
  if (!attributesMap.has('content')) {
    attributesMap.set('content', new Y.Map());
  }

  const contentMap = attributesMap.get('content') as Y.Map<any>;
  for (const block of blocks) {
    if (!contentMap.has(block.id)) {
      contentMap.set(block.id, new Y.Map());
    }

    const blockMap = contentMap.get(block.id) as Y.Map<any>;
    applyBlockChangesToYDoc(blockMap, block);
  }
};

const applyBlockChangesToYDoc = (blockMap: Y.Map<any>, block: NodeBlock) => {
  if (blockMap.get('id') !== block.id) {
    blockMap.set('id', block.id);
  }

  if (blockMap.get('type') !== block.type) {
    blockMap.set('type', block.type);
  }

  if (blockMap.get('index') !== block.index) {
    blockMap.set('index', block.index);
  }

  if (blockMap.get('parentId') !== block.parentId) {
    blockMap.set('parentId', block.parentId);
  }

  applyBlockAttrsChangesToYDoc(blockMap, block);
  applyBlockContentChangesToYDoc(blockMap, block);
};

const applyBlockAttrsChangesToYDoc = (
  blockMap: Y.Map<any>,
  block: NodeBlock,
) => {
  if (block.attrs === null) {
    if (blockMap.has('attrs')) {
      blockMap.delete('attrs');
    }

    return;
  }

  if (!blockMap.has('attrs')) {
    blockMap.set('attrs', new Y.Map());
  }

  const attrsMap = blockMap.get('attrs') as Y.Map<any>;
  for (const [key, value] of Object.entries(block.attrs)) {
    const existingValue = attrsMap.get(key);
    if (!isEqual(existingValue, value)) {
      attrsMap.set(key, value);
    }
  }
};

const applyBlockContentChangesToYDoc = (
  blockMap: Y.Map<any>,
  block: NodeBlock,
) => {
  if (block.content === null || block.content.length === 0) {
    if (blockMap.has('content')) {
      blockMap.delete('content');
    }

    return;
  }

  if (!blockMap.has('content')) {
    blockMap.set('content', new Y.Array());
  }

  const contentArray = blockMap.get('content') as Y.Array<any>;
  for (let i = 0; i < block.content.length; i++) {
    const blockContent = block.content[i];
    if (contentArray.length > i) {
      const blockContentMap = contentArray.get(i) as Y.Map<any>;
      applyBlockContentItemChangesToYDoc(blockContentMap, blockContent);
    } else {
      const blockContentMap = new Y.Map<any>();
      contentArray.insert(i, [blockContentMap]);
      applyBlockContentItemChangesToYDoc(blockContentMap, blockContent);
    }
  }
};

const applyBlockContentItemChangesToYDoc = (
  blockContentMap: Y.Map<any>,
  blockContent: NodeBlockContent,
) => {
  if (blockContentMap.get('type') !== blockContent.type) {
    blockContentMap.set('type', blockContent.type);
  }

  applyBlockContentTextChangesToYDoc(blockContentMap, blockContent);
  applyBlockContentMarksChangesToYDoc(blockContentMap, blockContent);
};

const applyBlockContentTextChangesToYDoc = (
  blockContentMap: Y.Map<any>,
  blockContent: NodeBlockContent,
) => {
  if (
    blockContent.text === null ||
    blockContent.text === undefined ||
    blockContent.text === ''
  ) {
    if (blockContentMap.has('text')) {
      blockContentMap.delete('text');
    }

    return;
  }

  if (!blockContentMap.has('text')) {
    blockContentMap.set('text', new Y.Text(blockContent.text));
    return;
  }

  const yText = blockContentMap.get('text') as Y.Text;
  const currentText = yText.toString();
  const newText = blockContent.text;

  if (currentText === newText) {
    return;
  }

  const diffs = diffChars(currentText, newText);
  let index = 0;
  for (const diff of diffs) {
    if (diff.added) {
      yText.insert(index, diff.value);
      index += diff.value.length;
    } else if (diff.removed) {
      yText.delete(index, diff.value.length);
      index -= diff.value.length;
    } else {
      index += diff.value.length;
    }
  }
};

const applyBlockContentMarksChangesToYDoc = (
  blockContentMap: Y.Map<any>,
  blockContent: NodeBlockContent,
) => {
  if (blockContent.marks === null || blockContent.marks.length === 0) {
    if (blockContentMap.has('marks')) {
      blockContentMap.delete('marks');
    }

    return;
  }

  const existingMarks = blockContentMap.get('marks');
  if (!isEqual(existingMarks, blockContent.marks)) {
    blockContentMap.set('marks', blockContent.marks);
  }
};
