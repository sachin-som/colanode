import { createContext, useContext } from 'react';
import { Workspace } from "@/types/workspaces";
import {Node} from "@/types/nodes";

interface WorkspaceContext extends Workspace {
  addNode: (node: Node) => Promise<void>
  getNodes: () => Promise<Node[]>
  updateNode: (node: Node) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceContext>(
  {} as WorkspaceContext,
);

export const useWorkspace = () => useContext(WorkspaceContext);

