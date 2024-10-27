import React from 'react';
import { getFileUrl } from '@/lib/files';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { cn } from '@/lib/utils';
import { FileIcon } from '@/renderer/components/files/file-icon';

interface FileThumbnailProps {
  id: string;
  name: string;
  mimeType: string;
  extension: string;
  downloadProgress?: number | null;
  className?: string;
}

export const FileThumbnail = ({
  id,
  name,
  mimeType,
  extension,
  downloadProgress,
  className,
}: FileThumbnailProps) => {
  const workspace = useWorkspace();

  if (downloadProgress === 100 && mimeType.startsWith('image')) {
    const url = getFileUrl(workspace.userId, id, extension);
    return (
      <img
        src={url}
        alt={name}
        className={cn('object-contain object-center', className)}
      />
    );
  }

  return <FileIcon mimeType={mimeType} className="size-10" />;
};
