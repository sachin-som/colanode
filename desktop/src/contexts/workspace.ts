import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';
import { CreateNodeInput, Node, UpdateNodeInput } from '@/types/nodes';

interface WorkspaceContext extends Workspace {
  createNode: (input: CreateNodeInput) => Promise<void>;
  createNodes: (inputs: CreateNodeInput[]) => Promise<void>;
  updateNode: (input: UpdateNodeInput) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  deleteNodes: (nodeIds: string[]) => Promise<void>;

  navigateToNode: (nodeId: string) => void;

  getSidebarNodes: () => Promise<Node[]>;
  getConversationNodes: (
    conversationId: string,
    count: number,
    after?: string | null,
  ) => Promise<Node[]>;
  getDocumentNodes: (documentId: string) => Promise<Node[]>;
  getContainerNodes: (containerId: string) => Promise<Node[]>;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);
