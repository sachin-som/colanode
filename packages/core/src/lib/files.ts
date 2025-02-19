import { FileSubtype } from '../types/files';

export const extractFileSubtype = (mimeType: string): FileSubtype => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }

  if (mimeType.startsWith('application/pdf')) {
    return 'pdf';
  }

  return 'other';
};
