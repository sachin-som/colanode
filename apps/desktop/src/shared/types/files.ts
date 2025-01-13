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
  entryId: string;
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

export type FileInteraction = {
  fileId: string;
  collaboratorId: string;
  rootId: string;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  lastOpenedAt: string | null;
  firstOpenedAt: string | null;
  version: bigint;
};
