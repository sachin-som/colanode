export type RecordCreateMutationInput = {
  type: 'record_create';
  userId: string;
  databaseId: string;
};

export type RecordCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    record_create: {
      input: RecordCreateMutationInput;
      output: RecordCreateMutationOutput;
    };
  }
}
