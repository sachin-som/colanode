import React from 'react';
import { match } from 'ts-pattern';
import { getFilePreviewType } from '@/lib/files';
import { FilePreviewImage } from '@/renderer/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@/renderer/components/files/previews/file-preview-video';
import { FilePreviewOther } from '@/renderer/components/files/previews/file-preview-other';

interface FilePreviewProps {
  url: string;
  name: string;
  mimeType: string;
}

export const FilePreview = ({ url, name, mimeType }: FilePreviewProps) => {
  const previewType = getFilePreviewType(mimeType);
  return match(previewType)
    .with('image', () => <FilePreviewImage url={url} name={name} />)
    .with('video', () => <FilePreviewVideo url={url} />)
    .with('other', () => <FilePreviewOther mimeType={mimeType} />)
    .otherwise(() => null);
};
