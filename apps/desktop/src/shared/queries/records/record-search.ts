import { RecordNode } from '@colanode/core';

export type RecordSearchQueryInput = {
  type: 'record_search';
  searchQuery: string;
  userId: string;
  databaseId: string;
  exclude?: string[];
};

declare module '@/shared/queries' {
  interface QueryMap {
    record_search: {
      input: RecordSearchQueryInput;
      output: RecordNode[];
    };
  }
}
