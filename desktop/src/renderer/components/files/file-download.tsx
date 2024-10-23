import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { Spinner } from '@/renderer/components/ui/spinner';

interface FileDownloadProps {
  id: string;
  downloadProgress: number | null;
}

export const FileDownload = ({ id, downloadProgress }: FileDownloadProps) => {
  const workspace = useWorkspace();
  const { mutate } = useMutation();

  if (downloadProgress === null) {
    return (
      <div
        className="flex cursor-pointer flex-col items-center gap-3 text-muted-foreground hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();

          mutate({
            input: {
              type: 'file_download',
              userId: workspace.userId,
              fileId: id,
            },
          });
        }}
      >
        <Icon name="download-2-line" className="h-10 w-10" />
        <p className="text-sm">
          File is not downloaded in your device. Click to download.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Spinner className="h-10 w-10" />
      <p className="text-sm">Downloading file...</p>
    </div>
  );
};
