import { ViewNode } from '@/types/databases';

export type DatabaseViewListQueryInput = {
  type: 'database_view_list';
  databaseId: string;
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    database_view_list: {
      input: DatabaseViewListQueryInput;
      output: ViewNode[];
    };
  }
}
