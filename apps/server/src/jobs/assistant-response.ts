import {
  generateId,
  IdType,
  generateNodeIndex,
  getNodeModel,
  NodeAttributes,
  DatabaseNode,
  RecordNode,
  DatabaseAttributes,
} from '@colanode/core';
import { Document } from '@langchain/core/documents';
import { StateGraph, Annotation } from '@langchain/langgraph';
import { database } from '@/data/database';
import { eventBus } from '@/lib/event-bus';
import { configuration } from '@/lib/configuration';
import { nodeRetrievalService } from '@/services/node-retrieval-service';
import { documentRetrievalService } from '@/services/document-retrieval-service';
import { JobHandler } from '@/types/jobs';
import {
  rewriteQuery,
  rerankDocuments,
  generateFinalAnswer,
  generateNoContextAnswer,
  assessUserIntent,
  generateDatabaseFilters,
} from '@/services/llm-service';
import { CallbackHandler } from 'langfuse-langchain';
import { fetchNode } from '@/lib/nodes';
import { sql } from 'kysely';
import { recordsRetrievalService } from '@/services/records-retrieval-service';

// ---------------------------------------------------------------------
// Job Input & Type Definitions
// ---------------------------------------------------------------------
export type AssistantResponseInput = {
  type: 'assistant_response';
  messageId: string;
  workspaceId: string;
};

declare module '@/types/jobs' {
  interface JobMap {
    assistant_response: {
      input: AssistantResponseInput;
    };
  }
}

// ---------------------------------------------------------------------
// State Definition for the Response Chain
// ---------------------------------------------------------------------
const ResponseState = Annotation.Root({
  userInput: Annotation<string>(),
  workspaceId: Annotation<string>(),
  userId: Annotation<string>(),
  userDetails: Annotation<{ name: string; email: string }>(),
  parentMessageId: Annotation<string>(),
  currentMessageId: Annotation<string>(),
  rewrittenQuery: Annotation<string>(),
  contextDocuments: Annotation<Document[]>(),
  chatHistory: Annotation<Document[]>(),
  rerankedContext: Annotation<
    Array<{
      index: number;
      score: number;
      type: string;
      sourceId: string;
    }>
  >(),
  topContext: Annotation<Document[]>(),
  finalAnswer: Annotation<string>(),
  citations: Annotation<Array<{ sourceId: string; quote: string }>>(),
  originalMessage: Annotation<any>(),
  intent: Annotation<'retrieve' | 'no_context'>(),
  databaseContext: Annotation<
    Array<{
      id: string;
      name: string;
      fields: Record<string, { type: string; name: string }>;
      sampleRecords: any[];
    }>
  >(),
  databaseFilters: Annotation<{
    shouldFilter: boolean;
    filters: Array<{
      databaseId: string;
      filters: any[]; // DatabaseViewFilterAttributes[]
    }>;
  }>(),
});

// ---------------------------------------------------------------------
// Chain Node Functions with Improved Naming
// ---------------------------------------------------------------------
async function generateRewrittenQuery(state: typeof ResponseState.State) {
  const rewritten = await rewriteQuery(state.userInput);
  return { rewrittenQuery: rewritten };
}

async function assessIntent(state: typeof ResponseState.State) {
  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'Unknown User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');

  const intent = await assessUserIntent(state.userInput, formattedChatHistory);
  return { intent };
}

async function generateNoContextResponse(state: typeof ResponseState.State) {
  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'Unknown User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');

  const answer = await generateNoContextAnswer(
    state.userInput,
    formattedChatHistory
  );
  return { finalAnswer: answer };
}

async function fetchContextDocuments(state: typeof ResponseState.State) {
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

  // If we have database filters, fetch the filtered records
  if (state.databaseFilters.shouldFilter) {
    const filteredRecords = await Promise.all(
      state.databaseFilters.filters.map(async (filter) => {
        const records = await recordsRetrievalService.retrieveByFilters(
          filter.databaseId,
          state.workspaceId,
          state.userId,
          {
            filters: filter.filters,
            sorts: [],
            page: 1,
            count: 10, // Fetch top 10 matching records
          }
        );

        // Get the database node to access its name
        const dbNode = await fetchNode(filter.databaseId);
        if (!dbNode || dbNode.type !== 'database') return [];

        const dbAttributes = dbNode.attributes as DatabaseAttributes;

        // Convert records to Documents
        return records.map((record) => {
          const recordNode = record as unknown as RecordNode;
          return new Document({
            pageContent: `Database Record from ${dbAttributes.name}:\n${Object.entries(
              recordNode.attributes.fields || {}
            )
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

    // Flatten the array of arrays into a single array
    databaseResults = filteredRecords.flat();
  }

  return {
    contextDocuments: [...nodeResults, ...documentResults, ...databaseResults],
  };
}

async function fetchChatHistory(state: typeof ResponseState.State) {
  const messages = await database
    .selectFrom('nodes')
    .innerJoin('collaborations', (join) =>
      join
        .onRef('collaborations.node_id', '=', 'nodes.root_id')
        .on('collaborations.collaborator_id', '=', sql.lit(state.userId))
        .on('collaborations.deleted_at', 'is', null)
    )
    .where('nodes.parent_id', '=', state.parentMessageId)
    .where('nodes.type', '=', 'message')
    .where('nodes.id', '!=', state.currentMessageId)
    .orderBy('nodes.created_at', 'asc')
    .selectAll()
    .execute();

  return {
    chatHistory: messages.map(
      (message) =>
        new Document({
          pageContent:
            getNodeModel(message.attributes.type)?.getAttributesText(
              message.id,
              message.attributes
            ) || '',
          metadata: {
            id: message.id,
            type: 'message',
            createdAt: message.created_at,
            author: message.created_by,
            authorName: message.created_by === 'colanode_ai' ? 'You' : 'User',
          },
        })
    ),
  };
}

async function rerankContextDocuments(state: typeof ResponseState.State) {
  const reranked = await rerankContext(
    state.contextDocuments,
    state.rewrittenQuery
  );
  return { rerankedContext: reranked };
}

async function selectRelevantDocuments(state: typeof ResponseState.State) {
  const topDocs = selectTopContext(
    state.rerankedContext,
    5,
    state.contextDocuments
  );
  return { topContext: topDocs };
}

// Add new helper function to fetch workspace details
async function fetchWorkspaceDetails(workspaceId: string) {
  return database
    .selectFrom('workspaces')
    .where('id', '=', workspaceId)
    .select(['name', 'id'])
    .executeTakeFirst();
}

async function generateResponse(state: typeof ResponseState.State) {
  const workspace = await fetchWorkspaceDetails(state.workspaceId);

  const formattedChatHistory = state.chatHistory
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'Unknown User';
      return `- [${timestamp}] ${authorName}: ${doc.pageContent}`;
    })
    .join('\n');

  const formattedMessages = state.topContext
    .filter((doc) => doc.metadata.type === 'message')
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      const authorName = doc.metadata.authorName || 'Unknown User';
      return `- [Source ${doc.metadata.id}]\n- Author: ${authorName}\n- Time: ${timestamp}\n- Content: ${doc.pageContent}\n`;
    })
    .join('\n');

  const formattedDocuments = state.topContext
    .filter((doc) => doc.metadata.type === 'document')
    .map((doc) => {
      const timestamp = doc.metadata.createdAt
        ? new Date(doc.metadata.createdAt).toLocaleString()
        : 'Unknown time';
      return `- [Source ${doc.metadata.id}]\n- Time: ${timestamp}\n- Content: ${doc.pageContent}\n`;
    })
    .join('\n');

  const result = await generateFinalAnswer({
    currentTimestamp: new Date().toISOString(),
    workspaceName: workspace?.name || state.workspaceId,
    userName: state.userDetails.name,
    userEmail: state.userDetails.email,
    formattedChatHistory,
    formattedMessages,
    formattedDocuments,
    question: state.userInput,
  });

  return {
    finalAnswer: result.answer,
    citations: result.citations,
  };
}

async function fetchDatabaseContext(state: typeof ResponseState.State) {
  // Fetch all databases the user has access to
  const databases = await database
    .selectFrom('nodes as n')
    .innerJoin('collaborations as c', 'c.node_id', 'n.root_id')
    .where('n.type', '=', 'database')
    .where('n.workspace_id', '=', state.workspaceId)
    .where('c.collaborator_id', '=', state.userId)
    .where('c.deleted_at', 'is', null)
    .selectAll()
    .execute();

  // For each database, fetch schema and sample records
  const databaseContext = await Promise.all(
    databases.map(async (db) => {
      const dbNode = db as unknown as DatabaseNode;
      // Get sample records
      const sampleRecords = await recordsRetrievalService.retrieveByFilters(
        db.id,
        state.workspaceId,
        state.userId,
        {
          filters: [],
          sorts: [],
          page: 1,
          count: 5, // Fetch 5 sample records
        }
      );

      // Extract field information from database attributes
      const fields = dbNode.attributes.fields || {};
      const formattedFields = Object.entries(fields).reduce(
        (acc, [id, field]) => ({
          ...acc,
          [id]: {
            type: field.type,
            name: field.name,
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

async function generateDatabaseFilterAttributes(
  state: typeof ResponseState.State
) {
  if (state.intent === 'no_context' || !state.databaseContext.length) {
    return {
      databaseFilters: {
        shouldFilter: false,
        filters: [],
      },
    };
  }

  const filters = await generateDatabaseFilters({
    query: state.userInput,
    databases: state.databaseContext,
  });

  return { databaseFilters: filters };
}

// ---------------------------------------------------------------------
// Build the Response Chain Graph
// ---------------------------------------------------------------------
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
  .addConditionalEdges('assessIntent', (state) => {
    return state.intent === 'no_context'
      ? 'generateNoContextResponse'
      : 'fetchDatabaseContext';
  })
  .addEdge('fetchDatabaseContext', 'generateDatabaseFilterAttributes')
  .addEdge('generateDatabaseFilterAttributes', 'generateRewrittenQuery')
  .addEdge('generateRewrittenQuery', 'fetchContextDocuments')
  .addEdge('fetchContextDocuments', 'rerankContextDocuments')
  .addEdge('rerankContextDocuments', 'selectRelevantDocuments')
  .addEdge('selectRelevantDocuments', 'generateResponse')
  .addEdge('generateResponse', '__end__')
  .addEdge('generateNoContextResponse', '__end__')
  .compile();

// ---------------------------------------------------------------------
// Initialize Langfuse Callback Handler
// ---------------------------------------------------------------------
const langfuseCallback = new CallbackHandler({
  publicKey: configuration.ai.langfuse.publicKey,
  secretKey: configuration.ai.langfuse.secretKey,
  baseUrl: configuration.ai.langfuse.baseUrl,
});

// ---------------------------------------------------------------------
// Main Job Handler
// ---------------------------------------------------------------------
export const assistantResponseHandler: JobHandler<
  AssistantResponseInput
> = async (input) => {
  const { messageId, workspaceId } = input;
  console.log('Starting assistant response handler', {
    messageId,
    workspaceId,
  });

  if (!configuration.ai.enabled) {
    return;
  }

  const message = await fetchNode(messageId);
  if (!message) return;

  const messageModel = getNodeModel(message.attributes.type);
  if (!messageModel) return;

  const messageText = messageModel.getAttributesText(
    message.id,
    message.attributes
  );
  if (!messageText) return;

  // Fetch user and workspace details only ONCE
  const [user, workspace] = await Promise.all([
    database
      .selectFrom('users')
      .where('id', '=', message.created_by)
      .selectAll()
      .executeTakeFirst(),
    fetchWorkspaceDetails(workspaceId),
  ]);
  if (!user || !workspace) return;

  try {
    const chainResult = await assistantResponseChain.invoke(
      {
        userInput: messageText,
        workspaceId,
        userId: user.id,
        userDetails: {
          name: user.name || 'Unknown User',
          email: user.email || 'unknown@example.com',
        },
        parentMessageId: message.parent_id || message.id,
        currentMessageId: message.id,
        originalMessage: message,
        intent: 'retrieve',
      },
      { callbacks: [langfuseCallback] }
    );

    await createAndPublishResponse(
      chainResult.finalAnswer,
      chainResult.citations,
      message,
      workspaceId
    );
    console.log('Response published successfully');
  } catch (error) {
    console.error('Error in assistant response handler:', error);
    await createAndPublishResponse(
      'Sorry, I encountered an error while processing your request.',
      [],
      message,
      workspaceId
    );
  }
};

// ---------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------
async function createAndPublishResponse(
  response: string,
  citations: Array<{ sourceId: string; quote: string }>,
  originalMessage: any,
  workspaceId: string
) {
  const id = generateId(IdType.Message);
  const blockId = generateId(IdType.Block);

  const messageAttributes: NodeAttributes = {
    type: 'message',
    subtype: 'standard',
    parentId: originalMessage.parent_id || originalMessage.id,
    content: {
      [blockId]: {
        id: blockId,
        type: 'paragraph',
        content: [{ type: 'text', text: response, marks: [] }],
        index: generateNodeIndex(),
        parentId: id,
      },
      ...citations.reduce((acc, citation) => {
        const citationBlockId = generateId(IdType.Block);
        return {
          ...acc,
          [citationBlockId]: {
            id: citationBlockId,
            type: 'citation',
            content: [
              { type: 'text', text: citation.quote, marks: [] },
              { type: 'text', text: citation.sourceId, marks: [] },
            ],
            index: generateNodeIndex(),
            parentId: id,
          },
        };
      }, {}),
    },
  };

  const createdMessage = await database
    .insertInto('nodes')
    .returningAll()
    .values({
      id,
      workspace_id: workspaceId,
      root_id: originalMessage.root_id,
      attributes: JSON.stringify(messageAttributes),
      created_by: 'colanode_ai',
      created_at: new Date(),
      state: Buffer.from([]),
    })
    .executeTakeFirst();

  if (!createdMessage) return;

  eventBus.publish({
    type: 'node_created',
    nodeId: createdMessage.id,
    rootId: createdMessage.root_id,
    workspaceId: createdMessage.workspace_id,
  });
}

async function rerankContext(context: Document[], query: string) {
  const documentsToRerank = context.map((doc) => ({
    content: doc.pageContent,
    type: doc.metadata.type,
    sourceId: doc.metadata.id,
  }));

  return await rerankDocuments(documentsToRerank, query);
}

function selectTopContext(
  reranked: {
    index: number;
    score: number;
    type: string;
    sourceId: string;
  }[],
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
