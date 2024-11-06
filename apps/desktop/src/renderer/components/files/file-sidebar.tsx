import React from 'react';
import { FileDetails } from '@/types/files';
import { formatBytes } from '@/lib/files';
import { formatDate } from '@/lib/utils';
import { FileThumbnail } from '@/renderer/components/files/file-thumbnail';
import { Avatar } from '@/renderer/components/avatars/avatar';

interface FileSidebarProps {
  file: FileDetails;
}

const FileMeta = ({ title, value }: { title: string; value: string }) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-foreground/80">{value}</p>
    </div>
  );
};

export const FileSidebar = ({ file }: FileSidebarProps) => {
  return (
    <React.Fragment>
      <div className="flex items-center gap-x-4 p-2">
        <FileThumbnail
          id={file.id}
          name={file.name}
          mimeType={file.mimeType}
          extension={file.extension}
          downloadProgress={file.downloadProgress}
          className="h-12 w-9 min-w-[36px] overflow-hidden rounded object-contain"
        />
        <div
          className="line-clamp-3 break-words text-base font-medium"
          title={file.name || file.fileName}
        >
          {file.name}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <FileMeta title="Name" value={file.name} />
        <FileMeta title="Type" value={file.mimeType} />
        <FileMeta title="Size" value={formatBytes(file.size)} />
        <FileMeta title="Created at" value={formatDate(file.createdAt)} />

        {file.createdBy && (
          <div>
            <p className="text-xs text-muted-foreground">Created by</p>
            <div className="mt-1 flex flex-row items-center gap-2">
              <Avatar
                id={file.createdBy.id}
                name={file.createdBy.name}
                avatar={file.createdBy.avatar}
                className="h-8 w-8"
              />
              <p className="text-foreground/80">{file.createdBy.name}</p>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
