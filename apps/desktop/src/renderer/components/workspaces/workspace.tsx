import React from 'react';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';
import { Layout } from '@/renderer/components/layouts/layout';

export const Workspace = () => {
  const { userId, nodeId } = useParams<{ userId: string; nodeId?: string }>();

  const account = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openSettings, setOpenSettings] = React.useState(false);
  const workspace = account.workspaces.find((w) => w.userId === userId);

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        navigateToNode(nodeId) {
          navigate(`/${userId}/${nodeId}`);
          if (nodeId === modal) {
            setSearchParams((prev) => {
              prev.delete('modal');
              return prev;
            });
          }
        },
        isNodeActive(id) {
          return id === nodeId;
        },
        openModal(modal) {
          setSearchParams((prev) => {
            return {
              ...prev,
              modal: modal,
            };
          });
        },
        closeModal() {
          setSearchParams((prev) => {
            prev.delete('modal');
            return prev;
          });
        },
        openSettings() {
          setOpenSettings(true);
        },
        markAsSeen(nodeId, versionId) {
          window.colanode.executeMutation({
            type: 'mark_node_as_seen',
            nodeId: nodeId,
            versionId: versionId,
            userId: workspace.userId,
          });
        },
      }}
    >
      <Layout nodeId={nodeId} modal={modal} />
      {openSettings && (
        <WorkspaceSettingsDialog
          open={openSettings}
          onOpenChange={setOpenSettings}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
