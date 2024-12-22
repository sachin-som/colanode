import { FileWithState } from '@/shared/types/files';

export type FileGetQueryInput = {
  type: 'file_get';
  id: string;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_get: {
      input: FileGetQueryInput;
      output: FileWithState | null;
    };
  }
}
