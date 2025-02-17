import {
  generateId,
  IdType,
  extractBlockTexts,
  MessageAttributes,
  NodeAttributes,
} from '@colanode/core';
import { Document } from '@langchain/core/documents';
import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { configuration } from '@/lib/configuration';
import { fetchNode } from '@/lib/nodes';
import { nodeRetrievalService } from '@/services/node-retrieval-service';
import { documentRetrievalService } from '@/services/document-retrieval-service';
import { JobHandler } from '@/types/jobs';
import {
  rewriteQuery,
  rerankDocuments,
  generateFinalAnswer,
  generateNoContextAnswer,
  assessUserIntent,
} from '@/services/llm-service';

export type AssistantResponseInput = {
  type: 'assistant_response';
  nodeId: string;
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    assistant_response: {
      input: AssistantResponseInput;
    };
  }
}

export const assistantResponseHandler = async (
  input: AssistantResponseInput
) => {
  const { nodeId, workspaceId } = input;
  console.log('Starting assistant response handler', { nodeId, workspaceId });
  if (!configuration.ai.enabled) return;

  const node = await fetchNode(nodeId);
  if (!node) return;
  // Assume nodes of type 'message' carry the user query.
  const userInputText = extractBlockTexts(
    node.id,
    (node.attributes as MessageAttributes).content
  );
  if (!userInputText || userInputText.trim() === '') return;

  // Fetch user details (assuming created_by is the user id)
  const user = await database
    .selectFrom('users')
    .where('id', '=', node.created_by)
    .selectAll()
    .executeTakeFirst();
  if (!user) return;

  // Get conversation history: for example, sibling nodes (other messages with the same parent)
  const chatHistoryNodes = await database
    .selectFrom('nodes')
    .selectAll()
    .where('parent_id', '=', node.parent_id)
    .where('id', '!=', node.id)
    .orderBy('created_at', 'asc')
    .limit(10)
    .execute();

  const chatHistory = chatHistoryNodes.map(
    (n) =>
      new Document({
        pageContent:
          extractBlockTexts(
            n.id,
            (n.attributes as MessageAttributes).content
          ) || '',
        metadata: { id: n.id, type: n.type, createdAt: n.created_at },
      })
  );

  const formattedChatHistory = chatHistory
    .map((doc) => {
      const ts = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown';
      return `- [${ts}] ${doc.metadata.id}: ${doc.pageContent}`;
    })
    .join('\n');

  const intent = await assessUserIntent(userInputText, formattedChatHistory);

  let finalAnswer: string;
  let citations: Array<{ sourceId: string; quote: string }>;

  if (intent === 'no_context') {
    finalAnswer = await generateNoContextAnswer(
      userInputText,
      formattedChatHistory
    );
    citations = [];
  } else {
    const rewrittenQuery = await rewriteQuery(userInputText);
    const nodeDocs = await nodeRetrievalService.retrieve(
      rewrittenQuery,
      workspaceId,
      user.id
    );
    const documentDocs = await documentRetrievalService.retrieve(
      rewrittenQuery,
      workspaceId
    );
    const allContext = [...nodeDocs, ...documentDocs];
    const reranked = await rerankDocuments(
      allContext.map((doc, idx) => ({
        content: doc.pageContent,
        type: doc.metadata.type,
        sourceId: doc.metadata.id,
      })),
      rewrittenQuery
    );
    const topContext = reranked.slice(0, 5);
    const formattedMessages = allContext
      .filter((doc) => doc.metadata.type === 'message')
      .map((doc) => {
        const ts = doc.metadata.createdAt
          ? new Date(doc.metadata.createdAt).toLocaleString()
          : 'Unknown';
        return `- [${ts}] ${doc.metadata.id}: ${doc.pageContent}`;
      })
      .join('\n');
    const formattedDocuments = allContext
      .filter(
        (doc) =>
          doc.metadata.type === 'page' || doc.metadata.type === 'document'
      )
      .map((doc) => {
        const ts = doc.metadata.createdAt
          ? new Date(doc.metadata.createdAt).toLocaleString()
          : 'Unknown';
        return `- [${ts}] ${doc.metadata.id}: ${doc.pageContent}`;
      })
      .join('\n');
    const promptArgs = {
      currentTimestamp: new Date().toISOString(),
      workspaceName: workspaceId, // Or retrieve workspace details
      userName: user.name || 'User',
      userEmail: user.email || 'unknown@example.com',
      formattedChatHistory,
      formattedMessages,
      formattedDocuments,
      question: userInputText,
    };
    const result = await generateFinalAnswer(promptArgs);
    finalAnswer = result.answer;
    citations = result.citations;
  }

  // Create a response node (answer message)
  const responseNodeId = generateId(IdType.Node);
  const responseAttributes = {
    type: 'message',
    subtype: 'standard',
    content: {
      [generateId(IdType.Block)]: {
        id: generateId(IdType.Block),
        type: 'paragraph',
        parentId: responseNodeId,
        index: 'a',
        content: [{ type: 'text', text: finalAnswer }],
      },
    },
    parentId: node.parent_id,
    referenceId: node.id,
  };

  await database
    .insertInto('nodes')
    .values({
      id: responseNodeId,
      root_id: node.root_id,
      workspace_id: workspaceId,
      attributes: JSON.stringify(responseAttributes),
      state: Buffer.from(''), // Initial empty state
      created_at: new Date(),
      created_by: 'colanode_ai',
    })
    .executeTakeFirst();

  eventBus.publish({
    type: 'node_created',
    nodeId: responseNodeId,
    rootId: node.root_id,
    workspaceId,
  });
};
