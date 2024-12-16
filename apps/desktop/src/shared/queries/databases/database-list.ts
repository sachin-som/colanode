import { DatabaseNode } from '@colanode/core';

export type DatabaseListQueryInput = {
  type: 'database_list';
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    database_list: {
      input: DatabaseListQueryInput;
      output: DatabaseNode[];
    };
  }
}
