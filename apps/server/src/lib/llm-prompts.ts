import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { NodeMetadata, DocumentMetadata } from '@/types/chunking';

export const queryRewritePrompt = PromptTemplate.fromTemplate(
  `<task>
  You are an expert at rewriting search queries to optimize for both semantic similarity and keyword-based search in a document retrieval system.
  Your task is to generate two separate optimized queries:
  1. A semantic search query optimized for vector embeddings and semantic similarity
  2. A keyword search query optimized for full-text search using PostgreSQL's tsquery
</task>

<guidelines>
  For semantic search query:
  1. Focus on conceptual meaning and intent
  2. Include context-indicating terms
  3. Preserve relationship words between concepts
  4. Expand concepts with related terms
  5. Remove noise words and syntax-specific terms
  
  For keyword search query:
  1. Focus on specific technical terms and exact matches
  2. Include variations of key terms
  3. Keep proper nouns and domain-specific vocabulary
  4. Optimize for PostgreSQL's websearch_to_tsquery syntax
  5. Include essential filters and constraints
</guidelines>

<input>
  Original query: {query}
</input>

<output_format>
  Return a JSON object with:
  {{
    "semanticQuery": "optimized query for semantic search",
    "keywordQuery": "optimized query for keyword search"
}}
</output_format>`
);

export const summarizationPrompt = PromptTemplate.fromTemplate(
  `<task>
  Summarize the following text focusing on key points relevant to the user's query.
  If the text is short (<100 characters), return it as is.
</task>

<input>
  Text: {text}
  User Query: {query}
</input>`
);

export const rerankPrompt = PromptTemplate.fromTemplate(
  `<task>
  You are the final relevance judge in a hybrid search system. Your task is to re-rank search results by analyzing their true relevance to the user's query.
  These documents have already passed through:
  1. Semantic search (vector similarity)
  2. Keyword-based search (full-text search)
  
  Your ranking will determine the final order and which documents are shown to the user.
</task>

<context>
  Each document contains:
  - Main content text
  - Optional summary/context
  - Metadata (type, creation info)
  The documents can be:
  - Workspace nodes (various content types)
  - Documents (files, notes)
  - Database records
</context>

<ranking_criteria>
  Evaluate relevance based on:
  1. Direct answer presence (highest priority)
     - Does the content directly answer the query?
     - Are key details or facts present?
  
  2. Contextual relevance
     - How well does the content relate to the query topic?
     - Is the context/summary relevant?
     - Does it provide important background information?
  
  3. Information freshness
     - For time-sensitive queries, prefer recent content
     - For conceptual queries, recency matters less
  
  4. Content completeness
     - Does it provide comprehensive information?
     - Are related concepts explained?
  
  5. Source appropriateness
     - Is the document type appropriate for the query?
     - Does the source authority match the information need?
</ranking_criteria>

<scoring_guidelines>
  Score from 0 to 1, where:
  1.0: Perfect match, directly answers query
  0.8-0.9: Highly relevant, contains most key information
  0.5-0.7: Moderately relevant, contains some useful information
  0.2-0.4: Tangentially relevant, minimal useful information
  0.0-0.1: Not relevant or useful for the query
</scoring_guidelines>

<documents>
  {context}
</documents>

<user_query>
  {query}
</user_query>

<output_format>
  Return a JSON array of objects, each containing:
  - "index": original position (integer)
  - "score": relevance score (0-1 float)
  - "type": document type (string)
  - "sourceId": original source ID (string)
  
  Example:
  [
    {{"index": 2, "score": 0.95, "type": "document", "sourceId": "doc123"}},
    {{"index": 0, "score": 0.7, "type": "node", "sourceId": "node456"}}
  ]
</output_format>`
);

export const answerPrompt = ChatPromptTemplate.fromTemplate(
  `<system_context>
  You are an AI assistant in a collaboration workspace app called Colanode.

  CURRENT TIME: {currentTimestamp}
  WORKSPACE: {workspaceName}
  USER: {userName} ({userEmail})
</system_context>

<current_conversation_history>
  {formattedChatHistory}
</current_conversation_history>

<context>
  {formattedDocuments}
</context>

<user_query>
  {question}
</user_query>

<task>
  Based solely on the current conversation history and the relevant context above, provide a clear and professional answer to the user's query. In your answer, include exact quotes from the provided context that support your answer.
  If the relevant context does not contain any information that answers the user's query, respond with "No relevant information found." This is a critical step to ensure correct answers.
</task>

<output_format>
  Return your response as a JSON object with the following structure:
  {{
    "answer": <your answer as a string>,
    "citations": [
      {{ "sourceId": <source id>, "quote": <exact quote from the context> }},
      ...
    ]
  }}
</output_format>`
);

export const intentRecognitionPrompt = PromptTemplate.fromTemplate(
  `<task>
  Determine if the following user query requires retrieving context from the workspace's knowledge base.
  You are a crucial decision point in an AI assistant system that must decide between:
  1. Retrieving and using specific context from the workspace ("retrieve")
  2. Answering directly from general knowledge ("no_context")
</task>

<context>
  This system has access to:
  - Documents and their embeddings
  - Node content (various types of workspace items)
  - Database records and their fields
  - Previous conversation history
</context>

<guidelines>
  Return "retrieve" when the query:
  - Asks about specific workspace content, documents, or data
  - References previous conversations or shared content
  - Mentions specific projects, tasks, or workspace items
  - Requires up-to-date information from the workspace
  - Contains temporal references to workspace activity
  - Asks about specific people or collaborators
  - Needs details about database records or fields

  Return "no_context" when the query:
  - Asks for general knowledge or common facts
  - Requests simple calculations or conversions
  - Asks about general concepts without workspace specifics
  - Makes small talk
  - Requests explanations of universal concepts
  - Can be answered correctly without workspace-specific information
</guidelines>

<examples>
  "retrieve" examples:
  - "What did John say about the API design yesterday?"
  - "Show me the latest documentation about user authentication"
  - "Find records in the Projects database where status is completed"
  - "What were the key points from our last meeting?"

  "no_context" examples:
  - "What is REST API?"
  - "How do I write a good commit message?"
  - "Convert 42 kilometers to miles"
  - "What's your name?"
  - "Explain what is Docker in simple terms"
</examples>

<conversation_history>
  {formattedChatHistory}
</conversation_history>

<user_query>
  {question}
</user_query>

<output_format>
  Return exactly one value: "retrieve" or "no_context"
</output_format>`
);

export const noContextPrompt = PromptTemplate.fromTemplate(
  `<task>
  Answer the following query concisely using general knowledge, without retrieving additional context. Return only the answer.
</task>

<conversation_history>
  {formattedChatHistory}
</conversation_history>

<user_query>
  {question}
</user_query>`
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
Created by: {createdAt}
{updatedAt}Workspace: {workspaceName}
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
  const formatDate = (date?: Date | string | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

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

  // Format creation info
  const createdAt = formatDate(metadata.createdAt);
  const createdBy = metadata.author?.name;
  const creationInfo =
    createdAt && createdBy
      ? `${createdBy} on ${createdAt}`
      : createdAt
        ? `Created on ${createdAt}`
        : createdBy
          ? `Created by ${createdBy}`
          : '';

  // Format update info
  const updatedAt = formatDate(metadata.updatedAt);
  const updatedBy = metadata.lastAuthor?.name;
  const updateInfo =
    updatedAt && updatedBy
      ? `Last updated on ${updatedAt} by ${updatedBy}\n`
      : updatedAt
        ? `Last updated on ${updatedAt}\n`
        : '';

  const baseVars: Record<string, string> = {
    nodeType:
      metadata.type === 'node'
        ? (metadata as NodeMetadata).nodeType
        : metadata.type,
    name: metadata.name || 'Untitled',
    createdAt: creationInfo || '',
    updatedAt: updateInfo || '',
    authorName: metadata.author?.name || '',
    lastAuthorName: metadata.lastAuthor?.name || '',
    path: metadata.parentContext?.path || '',
    workspaceName: metadata.workspace?.name || '',
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
