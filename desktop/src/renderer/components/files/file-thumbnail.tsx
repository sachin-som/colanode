import React from 'react';
import { getFileIcon, getFileUrl } from '@/lib/files';
import { Icon } from '@/renderer/components/ui/icon';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { cn } from '@/lib/utils';

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

  const icon = getFileIcon(mimeType);
  return <Icon name={icon} className={className} />;
};
