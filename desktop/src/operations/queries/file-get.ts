import { FileDetails } from '@/types/files';

export type FileGetQueryInput = {
  type: 'file_get';
  fileId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    file_get: {
      input: FileGetQueryInput;
      output: FileDetails;
    };
  }
}
