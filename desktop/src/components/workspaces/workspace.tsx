import React from 'react';
import { Sidebar } from '@/components/workspaces/sidebars/sidebar';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAccount } from '@/renderer/contexts/account';
import { Modal } from '@/components/workspaces/modals/modal';
import { WorkspaceSettingsDialog } from '@/components/workspaces/workspace-settings-dialog';

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const account = useAccount();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openSettings, setOpenSettings] = React.useState(false);
  const workspace = account.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        navigateToNode(nodeId) {
          navigate(`/${workspaceId}/${nodeId}`);
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
      }}
    >
      <div className="flex h-screen max-h-screen flex-row">
        <div className="w-96">
          <Sidebar />
        </div>
        <main className="h-full w-full min-w-128 flex-grow overflow-hidden bg-white">
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
      </div>
      {openSettings && (
        <WorkspaceSettingsDialog
          open={openSettings}
          onOpenChange={setOpenSettings}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
