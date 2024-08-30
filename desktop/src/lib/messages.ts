import { CreateNode } from '@/data/schemas/workspace';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LocalNode, NodeBlock } from '@/types/nodes';
import { LeafNodeTypes, NodeTypes } from '@/lib/constants';
import {
  buildNodeWithChildren,
  compareNodeId,
  generateNodeIndex,
} from '@/lib/nodes';
import { MessageNode } from '@/types/messages';

export const buildMessageCreateNodes = (
  nodes: CreateNode[],
  userId: string,
  workspaceId: string,
  parentId: string,
  content: JSONContent,
  index?: string | null,
) => {
  const id =
    content.attrs?.id ??
    NeuronId.generate(NeuronId.getIdTypeFromNode(content.type));

  let attrs = content.attrs ? { ...content.attrs } : null;
  if (attrs) {
    delete attrs.id;

    if (Object.keys(attrs).length === 0) {
      attrs = null;
    }
  }

  let nodeContent: NodeBlock[] | null = null;
  if (LeafNodeTypes.includes(content.type)) {
    nodeContent = [];
    for (const child of content.content) {
      nodeContent.push({
        type: child.type,
        text: child.text,
        marks: child.marks?.map((mark) => {
          return {
            type: mark.type,
            attrs: mark.attrs,
          };
        }),
      });
    }
  }

  if (nodeContent && nodeContent.length === 0) {
    nodeContent = null;
  }

  nodes.push({
    id: id,
    parent_id: parentId,
    type: content.type,
    attrs: attrs ? JSON.stringify(attrs) : null,
    index: index,
    content: nodeContent ? JSON.stringify(nodeContent) : null,
    created_at: new Date().toISOString(),
    created_by: userId,
    version_id: NeuronId.generate(NeuronId.Type.Version),
  });

  if (nodeContent == null && content.content && content.content.length > 0) {
    let lastIndex: string | null = null;
    for (const child of content.content) {
      lastIndex = generateNodeIndex(lastIndex, null);
      buildMessageCreateNodes(nodes, userId, workspaceId, id, child, lastIndex);
    }
  }
};

export const buildMessages = (allNodes: LocalNode[]): MessageNode[] => {
  const messageNodes = allNodes
    .filter((node) => node.type === NodeTypes.Message)
    .sort((a, b) => compareNodeId(a, b));

  const authorNodes = allNodes.filter((node) => node.type === NodeTypes.User);
  const messages: MessageNode[] = [];
  const authorMap = new Map<string, LocalNode>();

  for (const author of authorNodes) {
    authorMap.set(author.id, author);
  }

  for (const node of messageNodes) {
    const messageNode = buildNodeWithChildren(node, allNodes);
    const author = authorMap.get(node.createdBy);
    const message: MessageNode = {
      ...messageNode,
      author,
    };

    messages.push(message);
  }

  return messages.sort((a, b) => compareNodeId(a, b));
};
