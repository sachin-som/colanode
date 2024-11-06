import { FieldType } from '@/registry';

export type FieldCreateMutationInput = {
  type: 'field_create';
  databaseId: string;
  name: string;
  fieldType: FieldType;
  userId: string;
};

export type FieldCreateMutationOutput = {
  id: string;
};

declare module '@/operations/mutations' {
  interface MutationMap {
    field_create: {
      input: FieldCreateMutationInput;
      output: FieldCreateMutationOutput;
    };
  }
}
