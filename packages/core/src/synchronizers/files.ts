import { FileStatus, FileType } from '../types/files';

export type SyncFilesInput = {
  type: 'files';
  rootId: string;
};

export type SyncFileData = {
  id: string;
  type: FileType;
  parentId: string;
  rootId: string;
  workspaceId: string;
  revision: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  status: FileStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    files: {
      input: SyncFilesInput;
      data: SyncFileData;
    };
  }
}
