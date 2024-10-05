import { DatabaseNode } from '@/types/databases';

export type DatabaseGetQueryInput = {
  type: 'database_get';
  databaseId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    database_get: {
      input: DatabaseGetQueryInput;
      output: DatabaseNode;
    };
  }
}
