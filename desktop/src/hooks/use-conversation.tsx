import { LocalNode, NodeBlock } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes, NodeTypes } from '@/lib/constants';
import { buildNodeWithChildren, generateNodeIndex, mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { sql } from 'kysely';
import { CreateNode, SelectNode } from '@/data/schemas/workspace';
import { hashCode } from '@/lib/utils';
import { MessageNode } from '@/types/messages';

interface useConversationResult {
  isLoading: boolean;
  messages: MessageNode[];
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  createMessage: (content: JSONContent) => void;
}

export const useConversation = (
  conversationId: string,
): useConversationResult => {
  const workspace = useWorkspace();

  const messagesQuery = useQuery({
    queryKey: [`conversation:messages:${conversationId}`],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        WITH RECURSIVE conversation_hierarchy AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${conversationId} AND type = ${NodeTypes.Message}
            
            UNION ALL
            
            SELECT child.*
            FROM nodes child
            INNER JOIN conversation_hierarchy parent ON child.parent_id = parent.id
        )
        SELECT *
        FROM conversation_hierarchy;
      `.compile(workspace.schema);

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  const authorIds = [
    ...new Set(
      messagesQuery.data?.rows
        .filter((row) => row.type === NodeTypes.Message)
        .map((row) => row.created_by) ?? [],
    ),
  ];

  const authorIdsHash = hashCode(authorIds.join(','));
  const authorsQuery = useQuery({
    queryKey: [`authors:${authorIdsHash}`],
    enabled: authorIds.length > 0,
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('id', 'in', authorIds)
        .compile();

      const queryId = queryKey[0];
      return await workspace.queryAndSubscribe(queryId, query);
    },
  });

  const createMessage = async (content: JSONContent) => {
    const nodesToInsert: CreateNode[] = [];

    buildMessageCreateNodes(
      nodesToInsert,
      workspace.userId,
      workspace.id,
      conversationId,
      content,
    );

    const query = workspace.schema
      .insertInto('nodes')
      .values(nodesToInsert)
      .compile();
    await workspace.mutate(query);
  };

  const conversationNodes =
    messagesQuery.data?.rows.map((row) => mapNode(row)) ?? [];
  const authorNodes = authorsQuery.data?.rows.map((row) => mapNode(row)) ?? [];
  const messages = buildMessages(conversationNodes, authorNodes);

  return {
    isLoading: messagesQuery.isPending,
    messages: messages,
    hasMore: false,
    loadMore: () => console.log('load more'),
    isLoadingMore: false,
    createMessage: createMessage,
  };
};

const buildMessages = (
  nodes: LocalNode[],
  authors: LocalNode[],
): MessageNode[] => {
  const messages: MessageNode[] = [];
  const authorMap = new Map<string, LocalNode>();

  for (const author of authors) {
    authorMap.set(author.id, author);
  }

  for (const node of nodes) {
    if (node.type !== NodeTypes.Message) {
      continue;
    }

    const messageNode = buildNodeWithChildren(node, nodes);
    const author = authorMap.get(node.createdBy);
    const message: MessageNode = {
      ...messageNode,
      author,
    };

    messages.push(message);
  }

  return messages.sort((a, b) => {
    if (a.id > b.id) {
      return 1;
    } else if (a.id < b.id) {
      return -1;
    } else {
      return 0;
    }
  });
};

const buildMessageCreateNodes = (
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
