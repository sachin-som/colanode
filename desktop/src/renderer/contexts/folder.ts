import { FileNode } from '@/types/files';
import { createContext, useContext } from 'react';

interface FolderContext {
  id: string;
  name: string;
  files: FileNode[];
  onClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onDoubleClick: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  onMove: (nodeId: string, targetId: string) => void;
}

export const FolderContext = createContext<FolderContext>({} as FolderContext);

export const useFolder = () => useContext(FolderContext);
