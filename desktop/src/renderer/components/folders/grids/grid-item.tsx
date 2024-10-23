import React from 'react';
import { FileNode } from '@/types/files';
import { cn } from '@/lib/utils';
import { useFolder } from '@/renderer/contexts/folder';
import { GridFile } from '@/renderer/components/folders/grids/grid-file';

export const GridItem = ({ file }: { file: FileNode }) => {
  const folder = useFolder();

  const ref = React.useRef<HTMLDivElement>(null);
  const selected = false;

  return (
    <div
      ref={ref}
      className={cn(
        'flex cursor-pointer select-none flex-col items-center gap-2 p-2',
        selected ? 'bg-blue-100' : 'hover:bg-blue-50',
      )}
      onClick={(event) => folder.onClick(event, file.id)}
      onDoubleClick={(event) => folder.onDoubleClick(event, file.id)}
    >
      <GridFile file={file} />
    </div>
  );
};
