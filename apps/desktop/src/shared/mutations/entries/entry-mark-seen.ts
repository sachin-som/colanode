export type EntryMarkSeenMutationInput = {
  type: 'entry_mark_seen';
  userId: string;
  entryId: string;
};

export type EntryMarkSeenMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    entry_mark_seen: {
      input: EntryMarkSeenMutationInput;
      output: EntryMarkSeenMutationOutput;
    };
  }
}
