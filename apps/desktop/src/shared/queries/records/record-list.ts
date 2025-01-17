import {
  RecordEntry,
  ViewFilterAttributes,
  ViewSortAttributes,
} from '@colanode/core';

export type RecordListQueryInput = {
  type: 'record_list';
  databaseId: string;
  filters: ViewFilterAttributes[];
  sorts: ViewSortAttributes[];
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    record_list: {
      input: RecordListQueryInput;
      output: RecordEntry[];
    };
  }
}
