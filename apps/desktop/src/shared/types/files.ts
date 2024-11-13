export type ServerFileUploadResponse = {
  id: string;
  url: string;
};

export type ServerFileDownloadResponse = {
  id: string;
  url: string;
};

export type FileNode = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  extension: string;
  fileName: string;
  createdAt: string;
  downloadProgress?: number | null;
};

export type FilePreviewType = 'image' | 'video' | 'other';

export type FileMetadata = {
  path: string;
  mimeType: string;
  extension: string;
  name: string;
  size: number;
};
