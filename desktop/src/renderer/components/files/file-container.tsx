import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FilePreview } from '@/renderer/components/files/file-preview';
import { FileSidebar } from '@/renderer/components/files/file-sidebar';
import { FileDownload } from '@/renderer/components/files/file-download';

interface FileContainerProps {
  nodeId: string;
}

export const FileContainer = ({ nodeId }: FileContainerProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'file_get',
    userId: workspace.userId,
    fileId: nodeId,
  });

  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex h-full max-h-full w-full max-w-full flex-grow items-center justify-center overflow-hidden">
        {data.downloadProgress === 100 ? (
          <FilePreview file={data} />
        ) : (
          <FileDownload id={data.id} downloadProgress={data.downloadProgress} />
        )}
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={data} />
      </div>
    </div>
  );
};
