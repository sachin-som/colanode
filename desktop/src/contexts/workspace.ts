import { createContext, useContext } from 'react';
import { Workspace } from '@/types/workspaces';
import { CreateNodeInput, Node, UpdateNodeInput } from '@/types/nodes';

interface WorkspaceContext extends Workspace {
  createNode: (input: CreateNodeInput) => Promise<void>;
  createNodes: (inputs: CreateNodeInput[]) => Promise<void>;
  getNodes: () => Node[];
  updateNode: (input: UpdateNodeInput) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  deleteNodes: (nodeIds: string[]) => Promise<void>;
  setContainerNode: (nodeId?: string | null) => void;

  getConversationNodes: (conversationId: string, count: number, after?: string | null) => Promise<Node[]>;
  getDocumentNodes: (documentId: string) => Promise<Node[]>;
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);
