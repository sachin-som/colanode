export type FieldCreateMutationInput = {
  type: 'field_create';
  databaseId: string;
  name: string;
  dataType: string;
  userId: string;
};

export type FieldCreateMutationOutput = {
  id: string;
};

declare module '@/types/mutations' {
  interface MutationMap {
    field_create: {
      input: FieldCreateMutationInput;
      output: FieldCreateMutationOutput;
    };
  }
}
