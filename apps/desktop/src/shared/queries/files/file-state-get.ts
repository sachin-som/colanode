import { FileState } from '@/shared/types/files';

export type FileStateGetQueryInput = {
  type: 'file_state_get';
  id: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_state_get: {
      input: FileStateGetQueryInput;
      output: FileState | null;
    };
  }
}
