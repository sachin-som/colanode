import React from 'react';
import { Sidebar } from '@/renderer/components/workspaces/sidebars/sidebar';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { Modal } from '@/renderer/components/workspaces/modals/modal';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';
import {
  SidebarInset,
  SidebarProvider,
} from '@/renderer/components/ui/sidebar';

export const Workspace = () => {
  const { userId } = useParams<{ userId: string }>();

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
        },
        openModal(modal) {
          setSearchParams((prev) => {
            return {
              ...prev,
              modal: modal,
            };
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
      <SidebarProvider>
        <Sidebar />
        <SidebarInset>
          <main className="h-full max-h-screen w-full min-w-128 flex-grow overflow-hidden bg-white">
            <Outlet />
          </main>
          {modal && (
            <Modal
              nodeId={modal}
              key={modal}
              onClose={() => {
                setSearchParams((prev) => {
                  prev.delete('modal');
                  return prev;
                });
              }}
            />
          )}
        </SidebarInset>
        {openSettings && (
          <WorkspaceSettingsDialog
            open={openSettings}
            onOpenChange={setOpenSettings}
          />
        )}
      </SidebarProvider>
    </WorkspaceContext.Provider>
  );
};
