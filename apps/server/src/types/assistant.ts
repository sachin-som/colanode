import { Document } from '@langchain/core/documents';
import { Annotation } from '@langchain/langgraph';

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
  selectedContextNodeIds: Annotation<string[]>(),
});

export type AssistantChainState = typeof ResponseState.State;
