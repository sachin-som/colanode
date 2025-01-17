import { Entry } from '@colanode/core';

export type EntryTreeGetQueryInput = {
  type: 'entry_tree_get';
  entryId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    entry_tree_get: {
      input: EntryTreeGetQueryInput;
      output: Entry[];
    };
  }
}
