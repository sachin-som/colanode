import { Entry, EntryType } from '@colanode/core';

export type EntryChildrenGetQueryInput = {
  type: 'entry_children_get';
  entryId: string;
  userId: string;
  types?: EntryType[];
};

declare module '@/shared/queries' {
  interface QueryMap {
    entry_children_get: {
      input: EntryChildrenGetQueryInput;
      output: Entry[];
    };
  }
}
