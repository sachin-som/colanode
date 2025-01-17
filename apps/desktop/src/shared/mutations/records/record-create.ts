import { FieldValue } from '@colanode/core';

export type RecordCreateMutationInput = {
  type: 'record_create';
  accountId: string;
  workspaceId: string;
  databaseId: string;
  name?: string;
  fields?: Record<string, FieldValue>;
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
