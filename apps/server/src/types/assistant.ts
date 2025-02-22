import { Document } from '@langchain/core/documents';
import { Annotation } from '@langchain/langgraph';
import {
  RerankedDocuments,
  CitedAnswer,
  DatabaseFilterResult,
  RewrittenQuery,
} from './llm';

export type Citation = {
  sourceId: string;
  quote: string;
};

export type RerankedContextItem = {
  index: number;
  score: number;
  type: string;
  sourceId: string;
};

export type DatabaseFilter = {
  databaseId: string;
  filters: any[];
};

export type DatabaseFilters = {
  shouldFilter: boolean;
  filters: DatabaseFilter[];
};

export const ResponseState = Annotation.Root({
  userInput: Annotation<string>(),
  workspaceId: Annotation<string>(),
  userId: Annotation<string>(),
  userDetails: Annotation<{ name: string; email: string }>(),
  parentMessageId: Annotation<string>(),
  currentMessageId: Annotation<string>(),
  rewrittenQuery: Annotation<RewrittenQuery>(),
  contextDocuments: Annotation<Document[]>(),
  chatHistory: Annotation<Document[]>(),
  rerankedContext: Annotation<RerankedDocuments['rankings']>(),
  topContext: Annotation<Document[]>(),
  finalAnswer: Annotation<string>(),
  citations: Annotation<CitedAnswer['citations']>(),
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
  databaseFilters: Annotation<DatabaseFilterResult>(),
  selectedContextNodeIds: Annotation<string[]>(),
});

export type AssistantChainState = typeof ResponseState.State;
