import { createContext, useContext } from 'react';

import { File } from '@/shared/types/files';

interface FolderContext {
  id: string;
  name: string;
  files: File[];
  onClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onMove: (entryId: string, targetId: string) => void;
}

export const FolderContext = createContext<FolderContext>({} as FolderContext);

export const useFolder = () => useContext(FolderContext);
