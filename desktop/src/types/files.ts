import { UserNode } from '@/types/users';

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

export type FileDetails = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  extension: string;
  fileName: string;
  downloadProgress?: number | null;
  createdAt: string;
  createdBy: UserNode;
};

export type FilePreviewType = 'image' | 'video' | 'other';
