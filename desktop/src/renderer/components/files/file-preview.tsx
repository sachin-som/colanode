import React from 'react';
import { match } from 'ts-pattern';
import { FileDetails } from '@/types/files';
import { getFilePreviewType } from '@/lib/files';
import { FileDownload } from '@/renderer/components/files/file-download';
import { FilePreviewImage } from '@/renderer/components/files/previews/file-preview-image';
import { FilePreviewVideo } from '@/renderer/components/files/previews/file-preview-video';
import { FilePreviewOther } from '@/renderer/components/files/previews/file-preview-other';

interface FilePreviewProps {
  file: FileDetails;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  if (file.downloadProgress !== 100) {
    return (
      <FileDownload id={file.id} downloadProgress={file.downloadProgress} />
    );
  }

  const previewType = getFilePreviewType(file.mimeType);
  return match(previewType)
    .with('image', () => (
      <FilePreviewImage
        id={file.id}
        name={file.name}
        extension={file.extension}
      />
    ))
    .with('video', () => (
      <FilePreviewVideo
        id={file.id}
        name={file.name}
        extension={file.extension}
      />
    ))
    .with('other', () => (
      <FilePreviewOther
        id={file.id}
        name={file.name}
        extension={file.extension}
        mimeType={file.mimeType}
      />
    ))
    .otherwise(() => null);
};
