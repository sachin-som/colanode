import { Node } from '@/types/nodes';
import { useWorkspace } from '@/contexts/workspace';
import { JSONContent } from '@tiptap/core';
import { NeuronId } from '@/lib/id';
import { LeafNodeTypes, NodeTypes } from '@/lib/constants';
import { buildNodeWithChildren, generateNodeIndex, mapNode } from '@/lib/nodes';
import { useQuery } from '@tanstack/react-query';
import { sql } from 'kysely';
import { NodesTableSchema } from '@/data/schemas/workspace';
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

interface CreateNodeInput {
  id: string;
  parentId: string;
  type: string;
  attrs: Record<string, any>;
  content?: JSONContent[];
  index?: string | null;
}

export const useConversation = (
  conversationId: string,
): useConversationResult => {
  const workspace = useWorkspace();

  const messagesQuery = useQuery({
    queryKey: [`conversation:messages:${conversationId}`],
    queryFn: async ({ queryKey }) => {
      const query = sql<NodesTableSchema>`
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
      return await workspace.executeQueryAndSubscribe(queryId, query);
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
      return await workspace.executeQueryAndSubscribe(queryId, query);
    },
  });

  const createMessage = async (content: JSONContent) => {
    const inputs = buildMessageCreateInputs(conversationId, content);
    const createMessageQuery = workspace.schema
      .insertInto('nodes')
      .values(
        inputs.map((input) => {
          return {
            id: input.id,
            type: input.type,
            index: input.index,
            parent_id: input.parentId,
            workspace_id: workspace.id,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
            attrs: input.attrs && JSON.stringify(input.attrs),
            content: input.content && JSON.stringify(input.content),
          };
        }),
      )
      .compile();

    await workspace.executeQuery(createMessageQuery);
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

const buildMessages = (nodes: Node[], authors: Node[]): MessageNode[] => {
  const messages: MessageNode[] = [];
  const authorMap = new Map<string, Node>();

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

const buildMessageCreateInputs = (
  conversationId: string,
  content: JSONContent,
): CreateNodeInput[] => {
  const inputs: CreateNodeInput[] = [];
  buildMessageCreateInput(content, conversationId, inputs);
  return inputs;
};

const buildMessageCreateInput = (
  content: JSONContent,
  parentId: string,
  queue: CreateNodeInput[],
  index?: string | null,
): void => {
  const id = content.attrs?.id ?? NeuronId.generate(NeuronId.Type.Message);
  const input: CreateNodeInput = {
    id: id,
    parentId,
    type: content.type,
    attrs: {},
    index,
  };
  queue.push(input);

  if (content.attrs) {
    delete content.attrs.id;
    if (Object.keys(content.attrs).length > 0) {
      input.attrs = content.attrs;
    }
  }

  if (LeafNodeTypes.includes(content.type)) {
    input.content = [];
    for (const child of content.content) {
      input.content.push({
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
  } else {
    let lastIndex: string | null = null;
    for (const child of content.content) {
      lastIndex = generateNodeIndex(lastIndex, null);
      buildMessageCreateInput(child, id, queue, lastIndex);
    }
  }
};
