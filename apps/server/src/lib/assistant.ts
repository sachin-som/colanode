import { StateGraph } from '@langchain/langgraph';
import { Document } from '@langchain/core/documents';
import { database } from '@/data/database';
import { configuration } from '@/lib/configuration';
import { CallbackHandler } from 'langfuse-langchain';
import { fetchNode } from '@/lib/nodes';
import {
  rewriteQuery,
  assessUserIntent,
  generateNoContextAnswer,
  rerankDocuments,
  generateFinalAnswer,
  generateDatabaseFilters,
} from '@/services/llm-service';
import { nodeRetrievalService } from '@/services/node-retrieval-service';
import { documentRetrievalService } from '@/services/document-retrieval-service';
import { recordsRetrievalService } from '@/services/records-retrieval-service';
import { getNodeModel } from '@colanode/core';
import { AssistantChainState, ResponseState } from '@/types/assistant';

/* ---------------------------------------------------------------------
   Chain Node Functions
--------------------------------------------------------------------- */

async function generateRewrittenQuery(state: AssistantChainState) {
  const rewritten = await rewriteQuery(state.userInput);
  return { rewrittenQuery: rewritten };
}

async function assessIntent(state: AssistantChainState) {
  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');
  const intent = await assessUserIntent(state.userInput, formattedChatHistory);
  return { intent };
}

async function generateNoContextResponse(state: AssistantChainState) {
  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');
  const answer = await generateNoContextAnswer(
    state.userInput,
    formattedChatHistory
  );
  return { finalAnswer: answer };
}

async function fetchContextDocuments(state: AssistantChainState) {
  const [nodeResults, documentResults] = await Promise.all([
    nodeRetrievalService.retrieve(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId
    ),
    documentRetrievalService.retrieve(
      state.rewrittenQuery,
      state.workspaceId,
      state.userId
    ),
  ]);

  let databaseResults: Document[] = [];
  if (state.databaseFilters.shouldFilter) {
    const filteredRecords = await Promise.all(
      state.databaseFilters.filters.map(async (filter) => {
        const records = await recordsRetrievalService.retrieveByFilters(
          filter.databaseId,
          state.workspaceId,
          state.userId,
          { filters: filter.filters, sorts: [], page: 1, count: 10 }
        );
        const dbNode = await fetchNode(filter.databaseId);
        if (!dbNode || dbNode.type !== 'database') return [];
        return records.map((record) => {
          return new Document({
            pageContent: `Database Record from ${
              dbNode.attributes.type === 'database'
                ? dbNode.attributes.name || 'Database'
                : 'Database'
            }:\n${Object.entries((record as any).attributes.fields || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n')}`,
            metadata: {
              id: record.id,
              type: 'record',
              createdAt: record.created_at,
              author: record.created_by,
              databaseId: filter.databaseId,
            },
          });
        });
      })
    );
    databaseResults = filteredRecords.flat();
  }
  return {
    contextDocuments: [...nodeResults, ...documentResults, ...databaseResults],
  };
}

async function fetchChatHistory(state: AssistantChainState) {
  const messages = await database
    .selectFrom('nodes')
    .where('parent_id', '=', state.parentMessageId)
    .where('type', '=', 'message')
    .where('id', '!=', state.currentMessageId)
    .where('workspace_id', '=', state.workspaceId)
    .orderBy('created_at', 'asc')
    .selectAll()
    .execute();

  return {
    chatHistory: messages.map((message) => {
      const isAI = message.created_by === 'colanode_ai';
      const extracted = (message &&
        message.attributes &&
        getNodeModel(message.attributes.type)?.extractNodeText(
          message.id,
          message.attributes
        )) || { attributes: '' };
      const text = extracted.attributes;
      return new Document({
        pageContent: text || '',
        metadata: {
          id: message.id,
          type: 'message',
          createdAt: message.created_at,
          author: message.created_by,
          authorName: isAI ? 'Colanode AI' : 'User',
        },
      });
    }),
  };
}

async function rerankContextDocuments(state: AssistantChainState) {
  const reranked = await rerankDocuments(
    state.contextDocuments.map((doc) => ({
      content: doc.pageContent,
      type: doc.metadata.type,
      sourceId: doc.metadata.id,
    })),
    state.rewrittenQuery
  );
  return { rerankedContext: reranked };
}

async function selectRelevantDocuments(state: AssistantChainState) {
  const topDocs = selectTopContext(
    state.rerankedContext,
    5,
    state.contextDocuments
  );
  return { topContext: topDocs };
}

async function fetchWorkspaceDetails(workspaceId: string) {
  return database
    .selectFrom('workspaces')
    .where('id', '=', workspaceId)
    .select(['name', 'id'])
    .executeTakeFirst();
}

async function generateResponse(state: AssistantChainState) {
  const workspace = await fetchWorkspaceDetails(state.workspaceId);

  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');

  const formattedContext = state.topContext
    .map((doc) => {
      const timestamp = doc.metadata?.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata?.author?.name || 'Unknown';
      let contextHeader = `Source ID: ${doc.metadata.id}\nAuthor: ${authorName}\nTime: ${timestamp}`;
      if (
        doc.metadata?.type === 'node' &&
        doc.metadata.nodeType === 'record' &&
        doc.metadata.parentContext?.name
      ) {
        contextHeader += `\nDatabase: ${doc.metadata.parentContext.name}`;
      }
      return `${contextHeader}\nContent: "${doc.pageContent}"\n`;
    })
    .join('\n');

  const result = await generateFinalAnswer({
    currentTimestamp: new Date().toISOString(),
    workspaceName: workspace?.name || state.workspaceId,
    userName: state.userDetails.name,
    userEmail: state.userDetails.email,
    formattedChatHistory,
    formattedMessages: '',
    formattedDocuments: formattedContext,
    question: state.userInput,
  });

  return { finalAnswer: result.answer, citations: result.citations };
}

async function fetchDatabaseContext(state: AssistantChainState) {
  const databases = await database
    .selectFrom('nodes as n')
    .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
    .where('n.type', '=', 'database')
    .where('n.workspace_id', '=', state.workspaceId)
    .where('c.collaborator_id', '=', state.userId)
    .where('c.deleted_at', 'is', null)
    .selectAll()
    .execute();

  const databaseContext = await Promise.all(
    databases.map(async (db) => {
      const dbNode = db as any;
      const sampleRecords = await recordsRetrievalService.retrieveByFilters(
        db.id,
        state.workspaceId,
        state.userId,
        { filters: [], sorts: [], page: 1, count: 5 }
      );
      const fields = dbNode.attributes.fields || {};
      const formattedFields = Object.entries(fields).reduce(
        (acc, [id, field]) => ({
          ...acc,
          [id]: {
            type: (field as { type: string; name: string }).type,
            name: (field as { type: string; name: string }).name,
          },
        }),
        {}
      );
      return {
        id: db.id,
        name: dbNode.attributes.name || 'Untitled Database',
        fields: formattedFields,
        sampleRecords,
      };
    })
  );

  return { databaseContext };
}

async function generateDatabaseFilterAttributes(state: AssistantChainState) {
  if (state.intent === 'no_context' || !state.databaseContext.length) {
    return { databaseFilters: { shouldFilter: false, filters: [] } };
  }
  const filters = await generateDatabaseFilters({
    query: state.userInput,
    databases: state.databaseContext,
  });
  return { databaseFilters: filters };
}

function selectTopContext(
  reranked: Array<{
    index: number;
    score: number;
    type: string;
    sourceId: string;
  }>,
  max: number,
  contextDocuments: Document[]
): Document[] {
  if (reranked.length === 0) return [];
  const maxScore = Math.max(...reranked.map((item) => item.score));
  const threshold = maxScore * 0.5;

  return reranked
    .filter((item) => item.score >= threshold && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((item) => {
      if (item.index >= 0 && item.index < contextDocuments.length) {
        const doc = contextDocuments[item.index];
        if (!doc) return undefined;
        if (
          doc.metadata.id === item.sourceId &&
          doc.metadata.type === item.type
        ) {
          return doc;
        }
      }
      return undefined;
    })
    .filter((doc): doc is Document => doc !== undefined);
}

/* ---------------------------------------------------------------------
   Assistant response chain.
--------------------------------------------------------------------- */
const assistantResponseChain = new StateGraph(ResponseState)
  .addNode('generateRewrittenQuery', generateRewrittenQuery)
  .addNode('fetchContextDocuments', fetchContextDocuments)
  .addNode('fetchChatHistory', fetchChatHistory)
  .addNode('rerankContextDocuments', rerankContextDocuments)
  .addNode('selectRelevantDocuments', selectRelevantDocuments)
  .addNode('generateResponse', generateResponse)
  .addNode('assessIntent', assessIntent)
  .addNode('generateNoContextResponse', generateNoContextResponse)
  .addNode('fetchDatabaseContext', fetchDatabaseContext)
  .addNode('generateDatabaseFilterAttributes', generateDatabaseFilterAttributes)
  .addEdge('__start__', 'fetchChatHistory')
  .addEdge('fetchChatHistory', 'assessIntent')
  .addConditionalEdges('assessIntent', (state) =>
    state.intent === 'no_context'
      ? 'generateNoContextResponse'
      : 'generateRewrittenQuery'
  )
  .addEdge('generateRewrittenQuery', 'fetchContextDocuments')
  .addEdge('fetchContextDocuments', 'rerankContextDocuments')
  .addEdge('rerankContextDocuments', 'selectRelevantDocuments')
  .addEdge('selectRelevantDocuments', 'generateResponse')
  .addEdge('generateResponse', '__end__')
  .addEdge('generateNoContextResponse', '__end__')
  .compile();

const langfuseCallback = new CallbackHandler({
  publicKey: configuration.ai.langfuse.publicKey,
  secretKey: configuration.ai.langfuse.secretKey,
  baseUrl: configuration.ai.langfuse.baseUrl,
});

/* ---------------------------------------------------------------------
   Core orchestration logic.
--------------------------------------------------------------------- */
export async function runAssistantResponseChain(input: {
  userInput: string;
  workspaceId: string;
  userId: string;
  userDetails: { name: string; email: string };
  parentMessageId: string;
  currentMessageId: string;
  originalMessage: any;
}): Promise<{
  finalAnswer: string;
  citations: Array<{ sourceId: string; quote: string }>;
}> {
  const result = await assistantResponseChain.invoke(
    {
      ...input,
      intent: 'retrieve',
      databaseFilters: { shouldFilter: false, filters: [] },
    },
    { callbacks: [langfuseCallback] }
  );
  return { finalAnswer: result.finalAnswer, citations: result.citations };
}
