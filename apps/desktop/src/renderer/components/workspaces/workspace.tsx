import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { Layout } from '@/renderer/components/layouts/layout';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';
import { WorkspaceNotFound } from '@/renderer/components/workspaces/workspace-not-found';
import { useAccount } from '@/renderer/contexts/account';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const account = useAccount();
  const [searchParams, setSearchParams] = useSearchParams();

  const [openSettings, setOpenSettings] = React.useState(false);

  const { data, isPending } = useQuery({
    type: 'workspace_get',
    accountId: account.id,
    workspaceId: workspaceId!,
  });

  if (isPending) {
    return null;
  }

  if (!data) {
    return <WorkspaceNotFound />;
  }

  const workspace = data;

  if (!workspace) {
    return <p>Workspace not found</p>;
  }

  const main = searchParams.get('main');
  const modal = searchParams.get('modal');
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        openInMain(entryId) {
          setSearchParams((prev) => {
            prev.set('main', entryId);
            if (entryId === modal) {
              prev.delete('modal');
            }
            return prev;
          });
        },
        isEntryActive(id) {
          return id === main;
        },
        isModalActive(id) {
          return id === modal;
        },
        openInModal(modal) {
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
        closeMain() {
          setSearchParams((prev) => {
            prev.delete('main');
            return prev;
          });
        },
        closeEntry(id) {
          if (id === main) {
            setSearchParams((prev) => {
              prev.delete('main');
              return prev;
            });
          } else if (id === modal) {
            setSearchParams((prev) => {
              prev.delete('modal');
              return prev;
            });
          }
        },
        openSettings() {
          setOpenSettings(true);
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
