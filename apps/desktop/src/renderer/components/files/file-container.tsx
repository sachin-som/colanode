import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FilePreview } from '@/renderer/components/files/file-preview';
import { FileSidebar } from '@/renderer/components/files/file-sidebar';
import { Button } from '@/renderer/components/ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';
import { FileDownload } from '@/renderer/components/files/file-download';
import { getFileUrl } from '@/lib/files';
import { FileHeader } from './file-header';
import { extractNodeRole } from '@colanode/core';

interface FileContainerProps {
  nodeId: string;
}

export const FileContainer = ({ nodeId }: FileContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'node_with_ancestors_get',
    nodeId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const nodes = data ?? [];
  const file = nodes.find((node) => node.id === nodeId);
  const role = extractNodeRole(nodes, workspace.userId);
  const downloadProgress = 100;

  if (!file || file.type !== 'file' || !role) {
    return null;
  }

  const url = getFileUrl(workspace.userId, file.id, file.attributes.extension);
  return (
    <div className="flex h-full w-full flex-col">
      <FileHeader nodes={nodes} file={file} role={role} />
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
    </div>
  );
};
