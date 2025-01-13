import { Download } from 'lucide-react';

import { Spinner } from '@/renderer/components/ui/spinner';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';
import { DownloadStatus, FileWithState } from '@/shared/types/files';
import { formatBytes } from '@/shared/lib/files';

interface FileDownloadProps {
  file: FileWithState;
}

export const FileDownload = ({ file }: FileDownloadProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  const isDownloading = file.downloadStatus === DownloadStatus.Pending;

  return (
    <div className="flex h-full w-full items-center justify-center">
      {isDownloading ? (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-8" />
          <p className="text-sm">Downloading file ({file.downloadProgress}%)</p>
        </div>
      ) : (
        <div
          className="flex cursor-pointer flex-col items-center gap-3 text-muted-foreground hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            mutate({
              input: {
                type: 'file_download',
                userId: workspace.userId,
                fileId: file.id,
              },
              onError(error) {
                toast({
                  title: 'Failed to download file',
                  description: error.message,
                  variant: 'destructive',
                });
              },
            });
          }}
        >
          <Download className="size-8" />
          <p className="text-sm">
            File is not downloaded in your device. Click to download.
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)} - {file.mimeType}
          </p>
        </div>
      )}
    </div>
  );
};
