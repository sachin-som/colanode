import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SystemMessage } from '@langchain/core/messages';
import { configuration } from '@/lib/configuration';
import { Document } from '@langchain/core/documents';
import { z } from 'zod';
import type {
  ChunkingMetadata,
  NodeMetadata,
} from '@/services/chunking-service';
import { CallbackHandler } from 'langfuse-langchain';

const langfuseCallback = new CallbackHandler({
  publicKey: configuration.ai.langfuse.publicKey,
  secretKey: configuration.ai.langfuse.secretKey,
  baseUrl: configuration.ai.langfuse.baseUrl,
});

const rerankedDocumentsSchema = z.object({
  rankings: z.array(
    z.object({
      index: z.number(),
      score: z.number().min(0).max(1),
      type: z.enum(['node', 'document']),
      sourceId: z.string(),
    })
  ),
});
type RerankedDocuments = z.infer<typeof rerankedDocumentsSchema>;

const citedAnswerSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      sourceId: z.string(),
      quote: z.string(),
    })
  ),
});
type CitedAnswer = z.infer<typeof citedAnswerSchema>;

const databaseFilterSchema = z.object({
  shouldFilter: z.boolean(),
  filters: z.array(
    z.object({
      databaseId: z.string(),
      filters: z.array(z.any()), // Using any for DatabaseViewFilterAttributes since it's complex
    })
  ),
});

type DatabaseFilterResult = z.infer<typeof databaseFilterSchema>;

export const getChatModel = (
  task: keyof typeof configuration.ai.models
): ChatOpenAI | ChatGoogleGenerativeAI => {
  const modelConfig = configuration.ai.models[task];
  if (!configuration.ai.enabled) {
    throw new Error('AI is disabled.');
  }
  const providerConfig = configuration.ai.providers[modelConfig.provider];
  if (!providerConfig.enabled) {
    throw new Error(`${modelConfig.provider} provider is disabled.`);
  }
  switch (modelConfig.provider) {
    case 'openai':
      return new ChatOpenAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        openAIApiKey: providerConfig.apiKey,
      });
    case 'google':
      return new ChatGoogleGenerativeAI({
        modelName: modelConfig.modelName,
        temperature: modelConfig.temperature,
        apiKey: providerConfig.apiKey,
      });
    default:
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
  }
};

// Updated prompt templates using type-safe node types and context
const queryRewritePrompt = PromptTemplate.fromTemplate(
  `You are an expert at rewriting queries for information retrieval within Colanode.
  
Guidelines:
1. Extract the core information need.
2. Remove filler words.
3. Preserve key technical terms and dates.
  
Original query:
{query}
  
Rewrite the query and return only the rewritten version.`
);

const summarizationPrompt = PromptTemplate.fromTemplate(
  `Summarize the following text focusing on key points relevant to the user's query.
If the text is short (<100 characters), return it as is.
  
Text: {text}
User Query: {query}`
);

const rerankPrompt = PromptTemplate.fromTemplate(
  `Re-rank the following list of documents by their relevance to the query.
For each document, provide:
- Original index (from input)
- A relevance score between 0 and 1
- Document type (node or document)
- Source ID
  
User query:
{query}
  
Documents:
{context}
  
Return an array of rankings in JSON format.`
);

const answerPrompt = ChatPromptTemplate.fromTemplate(
  `You are Colanode's AI assistant.

CURRENT TIME: {currentTimestamp}
WORKSPACE: {workspaceName}
USER: {userName} ({userEmail})

CONVERSATION HISTORY:
{formattedChatHistory}

RELEVANT CONTEXT:
{formattedDocuments}

USER QUERY:
{question}

Based solely on the conversation history and the relevant context above, provide a clear and professional answer to the user's query. In your answer, include exact quotes from the provided context that support your answer.

Return your response as a JSON object with the following structure:
{{
  "answer": <your answer as a string>,
  "citations": [
    {{ "sourceId": <source id>, "quote": <exact quote from the context> }},
    ...
  ]
}}
`
);

const intentRecognitionPrompt = PromptTemplate.fromTemplate(
  `Determine if the following user query requires retrieving additional context.
Return exactly one value: "retrieve" or "no_context".

Conversation History:
{formattedChatHistory}

User Query:
{question}`
);

const noContextPrompt = PromptTemplate.fromTemplate(
  `Answer the following query concisely using general knowledge, without retrieving additional context.

Conversation History:
{formattedChatHistory}

User Query:
{question}

Return only the answer.`
);

const databaseFilterPrompt = ChatPromptTemplate.fromTemplate(
  `You are an expert at analyzing natural language queries and converting them into structured database filters.

Available Databases:
{databasesInfo}

User Query:
{query}

Your task is to:
1. Determine if this query is asking or makes sense to answer by filtering/searching databases
2. If yes, generate appropriate filter attributes for each relevant database
3. If no, return shouldFilter: false

Return a JSON object with:
- shouldFilter: boolean
- filters: array of objects with:
  - databaseId: string
  - filters: array of DatabaseViewFilterAttributes

Only include databases that are relevant to the query.
For each filter, use the exact field IDs from the database schema.
Use appropriate operators based on field types.

Example Response:
{{
  "shouldFilter": true,
  "filters": [
    {{
      "databaseId": "db1",
      "filters": [
        {{
          "type": "field",
          "fieldId": "field1",
          "operator": "contains",
          "value": "search term"
        }}
      ]
    }}
  ]
}}

Return a JSON object with:
- shouldFilter: boolean
- filters: array of objects with:
  - databaseId: string
  - filters: array of DatabaseViewFilterAttributes

Only include databases that are relevant to the query.
For each filter, use the exact field IDs from the database schema.
Use appropriate operators based on field types.`
);

export const rewriteQuery = async (query: string): Promise<string> => {
  const task = 'queryRewrite';
  const model = getChatModel(task);
  return queryRewritePrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ query });
};

export const summarizeDocument = async (
  document: Document,
  query: string
): Promise<string> => {
  const task = 'summarization';
  const model = getChatModel(task);
  return summarizationPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ text: document.pageContent, query });
};

export const rerankDocuments = async (
  documents: { content: string; type: string; sourceId: string }[],
  query: string
): Promise<
  Array<{ index: number; score: number; type: string; sourceId: string }>
> => {
  const task = 'rerank';
  const model = getChatModel(task).withStructuredOutput(
    rerankedDocumentsSchema
  );
  const formattedContext = documents
    .map(
      (doc, idx) =>
        `${idx}. Type: ${doc.type}, Content: ${doc.content}, ID: ${doc.sourceId}\n`
    )
    .join('\n');
  const result = (await rerankPrompt
    .pipe(model)
    .invoke({ query, context: formattedContext })) as RerankedDocuments;
  return result.rankings;
};

export const generateFinalAnswer = async (promptArgs: {
  currentTimestamp: string;
  workspaceName: string;
  userName: string;
  userEmail: string;
  formattedChatHistory: string;
  formattedMessages: string;
  formattedDocuments: string;
  question: string;
}): Promise<{
  answer: string;
  citations: Array<{ sourceId: string; quote: string }>;
}> => {
  const task = 'response';
  const model = getChatModel(task).withStructuredOutput(citedAnswerSchema);
  return (await answerPrompt.pipe(model).invoke(promptArgs)) as CitedAnswer;
};

export const generateNoContextAnswer = async (
  query: string,
  chatHistory: string = ''
): Promise<string> => {
  const task = 'noContext';
  const model = getChatModel(task);
  return noContextPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
};

export const assessUserIntent = async (
  query: string,
  chatHistory: string
): Promise<'retrieve' | 'no_context'> => {
  const task = 'intentRecognition';
  const model = getChatModel(task);
  const result = await intentRecognitionPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
  return result.trim().toLowerCase() === 'no_context'
    ? 'no_context'
    : 'retrieve';
};

const getNodeContextPrompt = (metadata: NodeMetadata): string => {
  const metadataLines = [
    metadata.name && `Name: ${metadata.name}`,
    metadata.author?.name &&
      `Created by: ${metadata.author.name} on ${metadata.createdAt}`,
    metadata.lastAuthor?.name &&
      metadata.updatedAt &&
      `Last updated: ${metadata.updatedAt} by ${metadata.lastAuthor.name}`,
    metadata.parentContext?.path && `Path: ${metadata.parentContext.path}`,
    metadata.workspace?.name && `Workspace: ${metadata.workspace.name}`,
  ].filter(Boolean);

  let additionalLines: string[] = [];
  const collaborators = metadata.collaborators
    ?.filter((c) => c.name)
    .map((c) => c.name)
    .join(', ');

  switch (metadata.nodeType) {
    case 'page':
      if (collaborators) {
        additionalLines.push(`Collaborators: ${collaborators}`);
      }
      break;

    case 'message':
      if (metadata.parentContext?.type || metadata.parentContext?.name) {
        additionalLines.push(
          `In: ${metadata.parentContext.type ?? 'channel'} "${metadata.parentContext.name ?? 'Untitled'}"`
        );
      }
      if (collaborators) {
        additionalLines.push(`Participants: ${collaborators}`);
      }
      break;

    case 'record':
      if (metadata.parentContext?.name) {
        additionalLines.push(`Database: ${metadata.parentContext.name}`);
      }
      if (metadata.fieldInfo) {
        const fieldDescriptions = Object.entries(metadata.fieldInfo)
          .map(([fieldId, info]) => `${info.name} (${info.type})`)
          .join(', ');
        additionalLines.push(`Fields: ${fieldDescriptions}`);
      }
      break;
  }

  const contextLines = [...metadataLines, ...additionalLines].filter(Boolean);
  const contextSection = `Given the following context about a ${metadata.nodeType === 'record' ? 'database record' : metadata.nodeType}:
${contextLines.join('\n')}`;

  const contentSection =
    metadata.nodeType === 'record'
      ? `\n\nContent:\n{chunk}`
      : `\n\nFull content:\n{fullText}\n\nCurrent chunk:\n{chunk}`;

  const instructionsSection =
    metadata.nodeType === 'record'
      ? `\n\nGenerate a brief (50-100 tokens) contextual prefix that:
1. Explains what this record represents
2. Highlights key information from its fields
3. Provides relevant context about which database it belongs to`
      : `\n\nGenerate a brief (50-100 tokens) contextual prefix that:
1. Explains what this chunk is part of
2. Provides relevant context from the metadata
3. Makes the chunk more understandable in isolation`;

  return `${contextSection}${contentSection}${instructionsSection}\nDo not repeat the content. Return only the contextual prefix.`;
};

interface PromptVariables {
  nodeType: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  lastAuthorName: string;
  path: string;
  workspaceName: string;
  fullText: string;
  chunk: string;
  [key: string]: string;
}

const documentContextPrompt = PromptTemplate.fromTemplate(
  `Given the following context about a document:
Type: {nodeType}
Name: {name}
Location: {path}
Created by: {authorName} on {createdAt}
Last updated: {updatedAt} by {lastAuthorName}
Workspace: {workspaceName}

Full content:
{fullText}

Current chunk:
{chunk}

Generate a brief (50-100 tokens) contextual prefix that:
1. Explains what this document is
2. Provides relevant context about its location and purpose
3. Makes the chunk more understandable in isolation
Do not repeat the chunk content. Return only the contextual prefix.`
);

export const addContextToChunk = async (
  chunk: string,
  fullText: string,
  metadata?: ChunkingMetadata
): Promise<string> => {
  try {
    if (!chunk || chunk.trim() === '') {
      return chunk;
    }

    if (!fullText || fullText.trim() === '') {
      return chunk;
    }

    if (!metadata) {
      return chunk;
    }

    const task = 'contextEnhancer';
    const model = getChatModel(task);

    let prompt: string;
    let promptVars: PromptVariables;

    const formatDate = (date?: Date) => {
      if (!date) return 'unknown';
      return new Date(date).toUTCString();
    };

    const baseVars = {
      nodeType: metadata.type === 'node' ? metadata.nodeType : metadata.type,
      name: metadata.name ?? 'Untitled',
      createdAt: formatDate(metadata.createdAt),
      updatedAt: metadata.updatedAt ? formatDate(metadata.updatedAt) : '',
      authorName: metadata.author?.name ?? 'Unknown',
      lastAuthorName: metadata.lastAuthor?.name ?? '',
      path: metadata.parentContext?.path ?? '',
      workspaceName: metadata.workspace?.name ?? 'Unknown Workspace',
      fullText,
      chunk,
    };

    //TODO: if metadata is empty, use a default context prompt for chunk

    if (metadata.type === 'node') {
      prompt = getNodeContextPrompt(metadata);
      promptVars = baseVars;
    } else {
      prompt = await documentContextPrompt.format(baseVars);
      promptVars = baseVars;
    }

    const formattedPrompt = Object.entries(promptVars).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, value),
      prompt
    );

    const response = await model.invoke(
      [new SystemMessage({ content: formattedPrompt })],
      {
        callbacks: [langfuseCallback],
      }
    );

    const prefix = (response.content.toString() || '').trim();
    return prefix ? `${prefix}\n\n${chunk}` : chunk;
  } catch (err) {
    console.error('Error in addContextToChunk:', err);
    return chunk;
  }
};

export const generateDatabaseFilters = async (args: {
  query: string;
  databases: Array<{
    id: string;
    name: string;
    fields: Record<string, { type: string; name: string }>;
    sampleRecords: any[];
  }>;
}): Promise<DatabaseFilterResult> => {
  const task = 'databaseFilter';
  const model = getChatModel(task).withStructuredOutput(databaseFilterSchema);

  // Format database information for the prompt
  const databasesInfo = args.databases
    .map(
      (db) => `
Database: ${db.name} (ID: ${db.id})
Fields:
${Object.entries(db.fields)
  .map(([id, field]) => `- ${field.name} (ID: ${id}, Type: ${field.type})`)
  .join('\n')}

Sample Records:
${db.sampleRecords
  .map(
    (record, i) =>
      `${i + 1}. ${Object.entries(record.attributes.fields)
        .map(([fieldId, value]) => `${db.fields[fieldId]?.name}: ${value}`)
        .join(', ')}`
  )
  .join('\n')}
`
    )
    .join('\n\n');

  return databaseFilterPrompt
    .pipe(model)
    .invoke({ query: args.query, databasesInfo });
};
