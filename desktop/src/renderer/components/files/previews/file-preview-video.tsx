import React from 'react';
import { getFileUrl } from '@/lib/files';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FilePreviewVideoProps {
  id: string;
  name: string;
  extension: string;
}

export const FilePreviewVideo = ({
  id,
  name,
  extension,
}: FilePreviewVideoProps) => {
  const workspace = useWorkspace();
  const url = getFileUrl(workspace.accountId, workspace.id, id, extension);

  return <video controls src={url} className="h-full w-full object-contain" />;
};
