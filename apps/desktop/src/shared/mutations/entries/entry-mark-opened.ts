export type EntryMarkOpenedMutationInput = {
  type: 'entry_mark_opened';
  accountId: string;
  workspaceId: string;
  entryId: string;
};

export type EntryMarkOpenedMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    entry_mark_opened: {
      input: EntryMarkOpenedMutationInput;
      output: EntryMarkOpenedMutationOutput;
    };
  }
}
