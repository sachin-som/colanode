import { FileNode } from '@colanode/core';
import { Button } from '@/renderer/components/ui/button';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { SquareArrowOutUpRight } from 'lucide-react';
import { FileDownload } from '@/renderer/components/files/file-download';
import { FilePreview } from '@/renderer/components/files/file-preview';
import { FileSidebar } from '@/renderer/components/files/file-sidebar';
import { getFileUrl } from '@/shared/lib/files';

interface FileBodyProps {
  file: FileNode;
}

export const FileBody = ({ file }: FileBodyProps) => {
  const workspace = useWorkspace();
  const downloadProgress = 100;

  const url = getFileUrl(workspace.userId, file.id, file.attributes.extension);
  return (
    <div className="flex h-full max-h-full w-full flex-row items-center gap-2">
      <div className="flex h-full max-h-full w-full max-w-full flex-grow flex-col items-center justify-center overflow-hidden">
        <div className="mr-2 flex w-full flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.colanode.openFile(
                workspace.userId,
                file.id,
                file.attributes.extension
              )
            }
          >
            <SquareArrowOutUpRight className="mr-1 size-4" /> Open
          </Button>
        </div>
        <div className="flex w-full max-w-full flex-grow items-center justify-center overflow-hidden">
          {downloadProgress !== 100 ? (
            <FileDownload id={file.id} downloadProgress={downloadProgress} />
          ) : (
            <FilePreview
              url={url}
              name={file.attributes.name}
              mimeType={file.attributes.mimeType}
            />
          )}
        </div>
      </div>
      <div className="h-full w-72 min-w-72 overflow-hidden border-l border-gray-100 p-2 pl-3">
        <FileSidebar file={file} downloadProgress={downloadProgress} />
      </div>
    </div>
  );
};
