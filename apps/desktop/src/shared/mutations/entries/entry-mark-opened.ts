export type EntryMarkOpenedMutationInput = {
  type: 'entry_mark_opened';
  userId: string;
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
