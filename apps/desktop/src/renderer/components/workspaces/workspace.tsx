import React from 'react';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { Layout } from '@/renderer/components/layouts/layout';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const account = useAccount();
  const [openSettings, setOpenSettings] = React.useState(false);

  const workspace = account.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const main = searchParams.get('main');
  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        navigateToNode(nodeId) {
          setSearchParams((prev) => {
            prev.set('main', nodeId);
            if (nodeId === modal) {
              prev.delete('modal');
            }
            return prev;
          });
        },
        isNodeActive(id) {
          return id === main;
        },
        openModal(modal) {
          setSearchParams((prev) => {
            prev.set('modal', modal);
            return prev;
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
        markAsSeen() {
          // window.colanode.executeMutation({
          //   type: 'mark_node_as_seen',
          //   nodeId: nodeId,
          //   versionId: versionId,
          //   userId: workspace.userId,
          // });
        },
      }}
    >
      <Layout main={main} modal={modal} />
      {openSettings && (
        <WorkspaceSettingsDialog
          open={openSettings}
          onOpenChange={() => setOpenSettings(false)}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
