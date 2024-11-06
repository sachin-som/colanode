import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FilePreview } from '@/renderer/components/files/file-preview';
import { FileSidebar } from '@/renderer/components/files/file-sidebar';
import { Button } from '@/renderer/components/ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';
import { FileDownload } from '@/renderer/components/files/file-download';
import { getFileUrl } from '@/lib/files';

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

  const url = getFileUrl(workspace.userId, data.id, data.extension);
  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex h-full max-h-full w-full max-w-full flex-grow flex-col items-center justify-center overflow-hidden">
        <div className="mr-2 flex w-full flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.neuron.openFile(workspace.userId, data.id, data.extension)
            }
          >
            <SquareArrowOutUpRight className="mr-1 size-4" /> Open
          </Button>
        </div>
        <div className="flex w-full max-w-full flex-grow items-center justify-center overflow-hidden">
          {data.downloadProgress !== 100 ? (
            <FileDownload
              id={data.id}
              downloadProgress={data.downloadProgress}
            />
          ) : (
            <FilePreview url={url} name={data.name} mimeType={data.mimeType} />
          )}
        </div>
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={data} />
      </div>
    </div>
  );
};
