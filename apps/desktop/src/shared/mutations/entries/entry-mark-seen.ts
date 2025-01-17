export type EntryMarkSeenMutationInput = {
  type: 'entry_mark_seen';
  accountId: string;
  workspaceId: string;
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
