import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';

interface WorkspaceContext extends Workspace {
  navigateToNode: (nodeId: string) => void;
  isNodeActive: (nodeId: string) => boolean;
  openModal: (nodeId: string) => void;
  openSettings: () => void;
  markAsSeen: (nodeId: string, versionId: string) => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext
);

export const useWorkspace = () => useContext(WorkspaceContext);
