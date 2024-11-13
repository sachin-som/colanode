export type RecordCreateMutationInput = {
  type: 'record_create';
  userId: string;
  databaseId: string;
  name?: string;
};

export type RecordCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    record_create: {
      input: RecordCreateMutationInput;
      output: RecordCreateMutationOutput;
    };
  }
}
