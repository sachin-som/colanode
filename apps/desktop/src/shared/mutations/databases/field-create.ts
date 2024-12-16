import { FieldType } from '@colanode/core';

export type FieldCreateMutationInput = {
  type: 'field_create';
  databaseId: string;
  name: string;
  fieldType: FieldType;
  relationDatabaseId?: string | null;
  userId: string;
};

export type FieldCreateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    field_create: {
      input: FieldCreateMutationInput;
      output: FieldCreateMutationOutput;
    };
  }
}
