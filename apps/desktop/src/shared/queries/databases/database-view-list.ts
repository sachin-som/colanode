import { LocalDatabaseViewNode } from '@/shared/types/nodes';

export type DatabaseViewListQueryInput = {
  type: 'database_view_list';
  accountId: string;
  workspaceId: string;
  databaseId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    database_view_list: {
      input: DatabaseViewListQueryInput;
      output: LocalDatabaseViewNode[];
    };
  }
}
