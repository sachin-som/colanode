import { createContext, useContext } from 'react';

import { Workspace } from '@/shared/types/workspaces';

interface WorkspaceContext extends Workspace {
  openInMain: (entryId: string) => void;
  isEntryActive: (entryId: string) => boolean;
  openInModal: (entryId: string) => void;
  isModalActive: (entryId: string) => boolean;
  closeModal: () => void;
  closeMain: () => void;
  closeEntry: (entryId: string) => void;
  openSettings: () => void;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext
);

export const useWorkspace = () => useContext(WorkspaceContext);
