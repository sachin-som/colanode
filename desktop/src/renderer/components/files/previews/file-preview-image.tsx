import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { getFileUrl } from '@/lib/files';

interface FilePreviewImageProps {
  id: string;
  name: string;
  extension: string;
}

export const FilePreviewImage = ({
  id,
  name,
  extension,
}: FilePreviewImageProps) => {
  const workspace = useWorkspace();
  const url = getFileUrl(workspace.userId, id, extension);

  return (
    <img
      src={url}
      alt={name}
      className="max-h-full max-w-full object-contain"
    />
  );
};
