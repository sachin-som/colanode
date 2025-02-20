export type CreateUploadInput = {
  fileId: string;
};

export type CreateUploadOutput = {
  url: string;
  uploadId: string;
};

export type CreateDownloadOutput = {
  url: string;
};

export type CompleteUploadOutput = {
  success: boolean;
};

export type FileSubtype = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export enum FileStatus {
  Pending = 0,
  Ready = 1,
  Error = 2,
}
