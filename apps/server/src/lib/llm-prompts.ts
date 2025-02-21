import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { NodeMetadata, DocumentMetadata } from '@/types/chunking';

export const queryRewritePrompt = PromptTemplate.fromTemplate(
  `You are an expert at rewriting queries for information retrieval within Colanode.
  
Guidelines:
1. Extract the core information need.
2. Remove filler words.
3. Preserve key technical terms and dates.
  
Original query:
{query}
  
Rewrite the query and return only the rewritten version.`
);

export const summarizationPrompt = PromptTemplate.fromTemplate(
  `Summarize the following text focusing on key points relevant to the user's query.
If the text is short (<100 characters), return it as is.
  
Text: {text}
User Query: {query}`
);

export const rerankPrompt = PromptTemplate.fromTemplate(
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

export const answerPrompt = ChatPromptTemplate.fromTemplate(
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
}}`
);

export const intentRecognitionPrompt = PromptTemplate.fromTemplate(
  `Determine if the following user query requires retrieving additional context.
Return exactly one value: "retrieve" or "no_context".

Conversation History:
{formattedChatHistory}

User Query:
{question}`
);

export const noContextPrompt = PromptTemplate.fromTemplate(
  `Answer the following query concisely using general knowledge, without retrieving additional context.

Conversation History:
{formattedChatHistory}

User Query:
{question}

Return only the answer.`
);

export const databaseFilterPrompt = ChatPromptTemplate.fromTemplate(
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

export function getNodeContextPrompt(metadata: any): string {
  const metadataLines = [
    metadata.name && `Name: ${metadata.name}`,
    metadata.author?.name &&
      `Created by: ${metadata.author.name} on ${new Date(metadata.createdAt)}`,
    metadata.lastAuthor?.name &&
      metadata.updatedAt &&
      `Last updated: ${new Date(metadata.updatedAt)} by ${metadata.lastAuthor.name}`,
    metadata.parentContext?.path && `Path: ${metadata.parentContext.path}`,
    metadata.workspace?.name && `Workspace: ${metadata.workspace.name}`,
  ]
    .filter(Boolean)
    .join('\n');

  const contextHeader = `Given the following context about a ${metadata.nodeType === 'record' ? 'database record' : metadata.nodeType}:\n${metadataLines}\n`;
  const contentSection =
    metadata.nodeType === 'record'
      ? `\n\nContent:\n{chunk}`
      : `\n\nFull content:\n{fullText}\n\nCurrent chunk:\n{chunk}`;
  const instructions = `\n\nGenerate a brief (50-100 tokens) contextual prefix that:
1. Explains what this ${metadata.nodeType === 'record' ? 'record' : 'chunk'} represents.
2. Highlights key details.
3. Provides context to make the chunk understandable in isolation.`;
  return `${contextHeader}${contentSection}${instructions}`;
}

export const documentContextPrompt = PromptTemplate.fromTemplate(
  `Given the following context about a document:
Type: {nodeType}
Name: {name}
Location: {path}
Created by: {authorName} on {createdAt}
Last updated: {updatedAt} by {lastAuthorName}
Workspace: {workspaceName}
{databaseContext}

Full content:
{fullText}

Current chunk:
{chunk}

Generate a brief (50-100 tokens) contextual prefix that:
1. Explains what this document is{recordInstructions}
2. Provides relevant context about its location and purpose.
3. Makes the chunk more understandable in isolation.
Do not repeat the chunk content. Return only the contextual prefix.`
);

export function prepareEnrichmentPrompt(
  chunk: string,
  fullText: string,
  metadata: NodeMetadata | DocumentMetadata
): { prompt: string; baseVars: Record<string, string> } {
  const formatDate = (date?: Date) =>
    date ? new Date(date).toUTCString() : 'unknown';

  let databaseContext = '';
  let recordInstructions = '';
  if (metadata.type === 'document' && metadata.databaseInfo) {
    databaseContext = `Database: ${metadata.databaseInfo.name}
Fields:
${Object.entries(metadata.databaseInfo.fields)
  .map(([_, field]) => `- ${field.name} (${field.type})`)
  .join('\n')}`;
    recordInstructions =
      ', including how it relates to the database record and its fields';
  }

  const baseVars: Record<string, string> = {
    nodeType:
      metadata.type === 'node'
        ? (metadata as NodeMetadata).nodeType
        : metadata.type,
    name: metadata.name ?? 'Untitled',
    createdAt: metadata.createdAt ? formatDate(metadata.createdAt) : '',
    updatedAt: metadata.updatedAt ? formatDate(metadata.updatedAt) : '',
    authorName: metadata.author?.name ?? 'Unknown',
    lastAuthorName: metadata.lastAuthor?.name ?? '',
    path: metadata.parentContext?.path ?? '',
    workspaceName: metadata.workspace?.name ?? 'Unknown Workspace',
    fullText,
    chunk,
    databaseContext,
    recordInstructions,
  };

  let prompt: string;
  if (metadata.type === 'node') {
    prompt = getNodeContextPrompt(metadata as NodeMetadata);
  } else {
    prompt = documentContextPrompt.template.toString();
  }
  Object.entries(baseVars).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return { prompt, baseVars };
}
