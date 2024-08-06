import React from 'react';
import { Sidebar } from '@/components/workspaces/sidebar';
import { WorkspaceCreate } from '@/components/workspaces/workspace-create';
import { WorkspaceContext } from '@/contexts/workspace';
import { useStore } from '@/contexts/store';
import { observer } from 'mobx-react-lite';
import { Container } from '@/components/workspaces/container';

export const Workspace = observer(() => {
  const store = useStore();
  const workspaces = store.workspaces;
  if (workspaces.length === 0) {
    return <WorkspaceCreate />;
  }

  const workspace = workspaces[0];

  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        addNode: async (node) => {
          await window.workspaceDb.addNode(
            workspace.accountId,
            workspace.id,
            node,
          );
          workspace.setNode(node);
        },
        addNodes: async (nodes) => {
          await window.workspaceDb.addNodes(
            workspace.accountId,
            workspace.id,
            nodes,
          );
          nodes.forEach((node) => workspace.setNode(node));
        },
        getNodes: () => {
          return workspace.getNodes();
        },
        updateNode: async (node) => {
          workspace.setNode(node);
          await window.workspaceDb.updateNode(
            workspace.accountId,
            workspace.id,
            node,
          );
        },
        deleteNode: async (nodeId) => {
          workspace.deleteNode(nodeId);
          await window.workspaceDb.deleteNode(
            workspace.accountId,
            workspace.id,
            nodeId,
          );
        },
        setContainerNode: (nodeId) => {
          workspace.setContainerNode(nodeId);
        },
      }}
    >
      <div className="flex h-screen max-h-screen flex-row">
        <div className="w-96">
          <Sidebar />
        </div>
        <main className="min-w-128 h-full w-full flex-grow overflow-hidden bg-white">
          {workspace.containerNodeId && (
            <Container nodeId={workspace.containerNodeId} />
          )}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
});
