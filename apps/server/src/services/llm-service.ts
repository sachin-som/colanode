// Updated llm-service.ts
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage } from '@langchain/core/messages';
import { configuration } from '@/lib/configuration';
import { Document } from '@langchain/core/documents';
import { z } from 'zod';
import { NodeAttributes } from '@colanode/core';

// Use proper Zod schemas and updated prompt templates

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

export function getChatModel(
  task: keyof typeof configuration.ai.models
): ChatOpenAI | ChatGoogleGenerativeAI {
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
}

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
  
RELATED CONTEXT:
Messages:
{formattedMessages}
Documents:
{formattedDocuments}
  
USER QUERY:
{question}
  
Provide a clear, professional answer. Then, in a separate citations array, list exact quotes (with source IDs) used to form your answer.
Return the result as JSON with keys "answer" and "citations".`
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

export async function rewriteQuery(query: string): Promise<string> {
  const task = 'queryRewrite';
  const model = getChatModel(task);
  return queryRewritePrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ query });
}

export async function summarizeDocument(
  document: Document,
  query: string
): Promise<string> {
  const task = 'summarization';
  const model = getChatModel(task);
  return summarizationPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ text: document.pageContent, query });
}

export async function rerankDocuments(
  documents: { content: string; type: string; sourceId: string }[],
  query: string
): Promise<
  Array<{ index: number; score: number; type: string; sourceId: string }>
> {
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
}

export async function generateFinalAnswer(promptArgs: {
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
}> {
  const task = 'response';
  const model = getChatModel(task).withStructuredOutput(citedAnswerSchema);
  return (await answerPrompt.pipe(model).invoke(promptArgs)) as CitedAnswer;
}

export async function generateNoContextAnswer(
  query: string,
  chatHistory: string = ''
): Promise<string> {
  const task = 'noContext';
  const model = getChatModel(task);
  return noContextPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
}

export async function assessUserIntent(
  query: string,
  chatHistory: string
): Promise<'retrieve' | 'no_context'> {
  const task = 'intentRecognition';
  const model = getChatModel(task);
  const result = await intentRecognitionPrompt
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ question: query, formattedChatHistory: chatHistory });
  return result.trim().toLowerCase() === 'no_context'
    ? 'no_context'
    : 'retrieve';
}

export async function addContextToChunk(
  chunk: string,
  fullText: string,
  metadata?: any
): Promise<string> {
  try {
    const task = 'contextEnhancer';
    const model = getChatModel(task);
    // Choose a prompt variant based on metadata type (node/document) if available.
    const promptTemplate = PromptTemplate.fromTemplate(
      `Using the following context information:
{contextInfo}

Full content:
{fullText}

Given this chunk:
{chunk}

Generate a short (50–100 tokens) contextual prefix (do not repeat the chunk) and prepend it to the chunk.`
    );
    const contextInfo = metadata
      ? `Type: ${metadata.type}, Name: ${metadata.name || 'N/A'}, Parent: ${metadata.parentName || 'N/A'}, Space: ${metadata.spaceName || 'N/A'}`
      : 'No additional context available.';
    const prompt = await promptTemplate.format({
      contextInfo,
      fullText,
      chunk,
    });
    const response = await model.invoke([
      new HumanMessage({ content: prompt }),
    ]);
    const prefix = (response.content.toString() || '').trim();
    return prefix ? `${prefix}\n\n${chunk}` : chunk;
  } catch (err) {
    console.error('Error in addContextToChunk:', err);
    return chunk;
  }
}
