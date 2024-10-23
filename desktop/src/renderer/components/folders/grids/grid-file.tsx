import React from 'react';
import { FileNode } from '@/types/files';
import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';

interface GridFileProps {
  file: FileNode;
}

export const GridFile = ({ file }: GridFileProps) => {
  return (
    <React.Fragment>
      <div className="flex w-full justify-center">
        <FileThumbnail
          id={file.id}
          mimeType={file.mimeType}
          extension={file.extension}
          downloadProgress={file.downloadProgress}
          name={file.name}
          className="h-14 w-14"
        />
      </div>
      <p
        className="line-clamp-2 w-full break-words text-center text-xs text-foreground/80"
        title={file.name}
      >
        {file.name}
      </p>
    </React.Fragment>
  );
};
