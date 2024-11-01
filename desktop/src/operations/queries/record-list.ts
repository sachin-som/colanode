import { RecordNode } from '@/types/nodes';
import { ViewFilterAttributes, ViewSortAttributes } from '@/registry';

export type RecordListQueryInput = {
  type: 'record_list';
  databaseId: string;
  filters: ViewFilterAttributes[];
  sorts: ViewSortAttributes[];
  page: number;
  count: number;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    record_list: {
      input: RecordListQueryInput;
      output: RecordNode[];
    };
  }
}
