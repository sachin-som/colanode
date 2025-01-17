import { Entry } from '@colanode/core';

export type EntryGetQueryInput = {
  type: 'entry_get';
  entryId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    entry_get: {
      input: EntryGetQueryInput;
      output: Entry | null;
    };
  }
}
