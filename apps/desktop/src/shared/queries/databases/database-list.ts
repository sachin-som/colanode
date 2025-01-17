import { DatabaseEntry } from '@colanode/core';

export type DatabaseListQueryInput = {
  type: 'database_list';
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    database_list: {
      input: DatabaseListQueryInput;
      output: DatabaseEntry[];
    };
  }
}
