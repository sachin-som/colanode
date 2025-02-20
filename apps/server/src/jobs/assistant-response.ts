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
import { recordsRetrievalService } from '@/services/records-retrieval-service';

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
      filters: any[];
    }>;
  }>(),
});

// ---------------------------------------------------------------------
// Chain Node Functions
// ---------------------------------------------------------------------
const generateRewrittenQuery = async (state: typeof ResponseState.State) => {
  const rewritten = await rewriteQuery(state.userInput);
  return { rewrittenQuery: rewritten };
};

const assessIntent = async (state: typeof ResponseState.State) => {
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
};

const generateNoContextResponse = async (state: typeof ResponseState.State) => {
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
};

const fetchContextDocuments = async (state: typeof ResponseState.State) => {
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
          {
            filters: filter.filters,
            sorts: [],
            page: 1,
            count: 10,
          }
        );
        const dbNode = await fetchNode(filter.databaseId);
        if (!dbNode || dbNode.type !== 'database') return [];
        const dbAttributes = dbNode.attributes as DatabaseAttributes;
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
    databaseResults = filteredRecords.flat();
  }

  return {
    contextDocuments: [...nodeResults, ...documentResults, ...databaseResults],
  };
};

const fetchChatHistory = async (state: typeof ResponseState.State) => {
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
      // Extract text using the node model's extractor for clean output
      const extracted = getNodeModel(message.attributes.type)?.extractNodeText(
        message.id,
        message.attributes
      );
      const text = extracted ? extracted.attributes : '';
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
};

const rerankContextDocuments = async (state: typeof ResponseState.State) => {
  const reranked = await rerankDocuments(
    state.contextDocuments.map((doc) => ({
      content: doc.pageContent,
      type: doc.metadata.type,
      sourceId: doc.metadata.id,
    })),
    state.rewrittenQuery
  );
  return { rerankedContext: reranked };
};

const selectRelevantDocuments = async (state: typeof ResponseState.State) => {
  const topDocs = selectTopContext(
    state.rerankedContext,
    5,
    state.contextDocuments
  );
  return { topContext: topDocs };
};

const fetchWorkspaceDetails = async (workspaceId: string) => {
  return database
    .selectFrom('workspaces')
    .where('id', '=', workspaceId)
    .select(['name', 'id'])
    .executeTakeFirst();
};

const generateResponse = async (state: typeof ResponseState.State) => {
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
      const authorName = doc.metadata?.author || 'Unknown';
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

  return {
    finalAnswer: result.answer,
    citations: result.citations,
  };
};

const fetchDatabaseContext = async (state: typeof ResponseState.State) => {
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
      const dbNode = db as unknown as DatabaseNode;
      const sampleRecords = await recordsRetrievalService.retrieveByFilters(
        db.id,
        state.workspaceId,
        state.userId,
        {
          filters: [],
          sorts: [],
          page: 1,
          count: 5,
        }
      );
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
};

const generateDatabaseFilterAttributes = async (
  state: typeof ResponseState.State
) => {
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
};

const selectTopContext = (
  reranked: {
    index: number;
    score: number;
    type: string;
    sourceId: string;
  }[],
  max: number,
  contextDocuments: Document[]
): Document[] => {
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
        if (!doc) {
          return undefined;
        }

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
};

// ---------------------------------------------------------------------
// Response Chain Graph
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
      : 'generateRewrittenQuery';
  })
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
  if (!message) {
    return;
  }

  const messageModel = getNodeModel(message.attributes.type);
  if (!messageModel) {
    return;
  }

  const messageText = messageModel.extractNodeText(
    message.id,
    message.attributes
  );
  if (!messageText || !messageText.attributes) {
    return;
  }

  const [user, workspace] = await Promise.all([
    database
      .selectFrom('users')
      .where('id', '=', message.created_by)
      .selectAll()
      .executeTakeFirst(),
    fetchWorkspaceDetails(workspaceId),
  ]);
  if (!user || !workspace) {
    return;
  }

  try {
    const chainResult = await assistantResponseChain.invoke(
      {
        userInput: messageText.attributes,
        workspaceId,
        userId: user.id,
        userDetails: {
          name: user.name || 'User',
          email: user.email || 'unknown@example.com',
        },
        parentMessageId: message.parent_id || message.id,
        currentMessageId: message.id,
        originalMessage: message,
        intent: 'retrieve',
        databaseFilters: { shouldFilter: false, filters: [] },
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

const createAndPublishResponse = async (
  response: string,
  citations: Array<{ sourceId: string; quote: string }> | undefined,
  originalMessage: any,
  workspaceId: string
) => {
  const id = generateId(IdType.Message);
  const blockId = generateId(IdType.Block);

  const messageAttributes: NodeAttributes = {
    type: 'message',
    subtype: 'answer',
    parentId: originalMessage.parent_id,
    content: {
      [blockId]: {
        id: blockId,
        type: 'paragraph',
        content: [{ type: 'text', text: response, marks: [] }],
        index: generateNodeIndex(),
        parentId: id,
      },
      ...(citations?.reduce((acc, citation) => {
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
      }, {}) || {}),
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
      revision: BigInt(0),
    })
    .executeTakeFirst();

  if (!createdMessage) {
    return;
  }

  eventBus.publish({
    type: 'node_created',
    nodeId: createdMessage.id,
    rootId: createdMessage.root_id,
    workspaceId: createdMessage.workspace_id,
  });
};
