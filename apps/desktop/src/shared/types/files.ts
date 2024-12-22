import { FileStatus, FileType } from '@colanode/core';

export type FileMetadata = {
  path: string;
  mimeType: string;
  extension: string;
  name: string;
  size: number;
  type: FileType;
};

export type File = {
  id: string;
  type: FileType;
  parentId: string;
  rootId: string;
  name: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  status: FileStatus;
  version: bigint;
};

export type DownloadStatus = 'none' | 'pending' | 'completed' | 'failed';
export type UploadStatus = 'none' | 'pending' | 'completed' | 'failed';

export type FileState = {
  fileId: string;
  downloadProgress: number;
  downloadStatus: DownloadStatus;
  downloadRetries: number;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  uploadRetries: number;
  createdAt: string;
  updatedAt: string | null;
};

export type FileWithState = File & {
  downloadProgress: number;
  downloadStatus: DownloadStatus;
  uploadProgress: number;
  uploadStatus: UploadStatus;
};
