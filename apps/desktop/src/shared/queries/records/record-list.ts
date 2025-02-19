import {
  DatabaseViewFilterAttributes,
  DatabaseViewSortAttributes,
} from '@colanode/core';

import { LocalRecordNode } from '@/shared/types/nodes';

export type RecordListQueryInput = {
  type: 'record_list';
  databaseId: string;
  filters: DatabaseViewFilterAttributes[];
  sorts: DatabaseViewSortAttributes[];
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    record_list: {
      input: RecordListQueryInput;
      output: LocalRecordNode[];
    };
  }
}
