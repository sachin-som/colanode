import { RecordNode, ViewFilter, ViewSort } from '@/types/databases';

export type RecordListQueryInput = {
  type: 'record_list';
  databaseId: string;
  filters: ViewFilter[];
  sorts: ViewSort[];
  page: number;
  count: number;
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    record_list: {
      input: RecordListQueryInput;
      output: RecordNode[];
    };
  }
}
