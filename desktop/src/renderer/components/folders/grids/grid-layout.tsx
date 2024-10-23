import React from 'react';
import { GridItem } from '@/renderer/components/folders/grids/grid-item';
import { useFolder } from '@/renderer/contexts/folder';

export const GridLayout = () => {
  const folder = useFolder();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
      {folder.files.map((file) => (
        <GridItem key={file.id} file={file} />
      ))}
    </div>
  );
};
