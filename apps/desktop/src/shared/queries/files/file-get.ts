import { File } from '@/shared/types/files';

export type FileGetQueryInput = {
  type: 'file_get';
  id: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_get: {
      input: FileGetQueryInput;
      output: File | null;
    };
  }
}
