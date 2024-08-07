import React from 'react';
import { Sidebar } from '@/components/workspaces/sidebar';
import { WorkspaceContext } from '@/contexts/workspace';
import { useStore } from '@/contexts/store';
import { observer } from 'mobx-react-lite';
import { Outlet, useNavigate, useParams } from 'react-router-dom';

export const Workspace = observer(() => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const store = useStore();
  const navigate = useNavigate();

  const workspace = store.getWorkspace(workspaceId);
  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        createNode: async (input) => {
          await window.workspaceDb.createNode(
            workspace.accountId,
            workspace.id,
            input,
          );
        },
        createNodes: async (inputs) => {
          await window.workspaceDb.createNodes(
            workspace.accountId,
            workspace.id,
            inputs,
          );
        },
        getNodes: () => {
          return workspace.getNodes();
        },
        updateNode: async (node) => {
          await window.workspaceDb.updateNode(
            workspace.accountId,
            workspace.id,
            node,
          );
        },
        deleteNode: async (nodeId) => {
          await window.workspaceDb.deleteNode(
            workspace.accountId,
            workspace.id,
            nodeId,
          );
        },
        deleteNodes: async (nodeIds) => {
          await window.workspaceDb.deleteNodes(
            workspace.accountId,
            workspace.id,
            nodeIds,
          );
        },
        getConversationNodes: async (conversationId, count, after) => {
          return await window.workspaceDb.getConversationNodes(
            workspace.accountId,
            workspace.id,
            conversationId,
            count,
            after,
          );
        },
        getDocumentNodes: async (documentId) => {
          return await window.workspaceDb.getDocumentNodes(
            workspace.accountId,
            workspace.id,
            documentId,
          );
        },
        navigateToNode(nodeId) {
          navigate(`/${workspaceId}/${nodeId}`);
        },
      }}
    >
      <div className="flex h-screen max-h-screen flex-row">
        <div className="w-96">
          <Sidebar />
        </div>
        <main className="min-w-128 h-full w-full flex-grow overflow-hidden bg-white">
          <Outlet />
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
});
