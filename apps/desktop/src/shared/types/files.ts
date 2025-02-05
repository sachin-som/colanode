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
  revision: bigint;
  name: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  downloadStatus: DownloadStatus;
  downloadProgress: number;
  downloadRetries: number;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadRetries: number;
  status: FileStatus;
};

export enum DownloadStatus {
  None = 0,
  Pending = 1,
  Completed = 2,
  Failed = 3,
}

export enum UploadStatus {
  None = 0,
  Pending = 1,
  Completed = 2,
  Failed = 3,
}
