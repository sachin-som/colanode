import { RecordNode } from '@/types/databases';

export type RecordGetQueryInput = {
  type: 'record_get';
  recordId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    record_get: {
      input: RecordGetQueryInput;
      output: RecordNode;
    };
  }
}
