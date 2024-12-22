import { createContext, useContext } from 'react';

import { FileWithState } from '@/shared/types/files';

interface FolderContext {
  id: string;
  name: string;
  files: FileWithState[];
  onClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onMove: (nodeId: string, targetId: string) => void;
}

export const FolderContext = createContext<FolderContext>({} as FolderContext);

export const useFolder = () => useContext(FolderContext);
