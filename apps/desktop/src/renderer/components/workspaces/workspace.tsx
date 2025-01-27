import React from 'react';
import { useParams } from 'react-router-dom';

import { Layout } from '@/renderer/components/layouts/layout';
import { WorkspaceSettingsDialog } from '@/renderer/components/workspaces/workspace-settings-dialog';
import { WorkspaceNotFound } from '@/renderer/components/workspaces/workspace-not-found';
import { useAccount } from '@/renderer/contexts/account';
import { WorkspaceContext } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import {
  WorkspaceMetadataKey,
  WorkspaceMetadataMap,
} from '@/shared/types/workspaces';

export const Workspace = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const account = useAccount();
  const [openSettings, setOpenSettings] = React.useState(false);

  const { data: workspace, isPending: isPendingWorkspace } = useQuery({
    type: 'workspace_get',
    accountId: account.id,
    workspaceId: workspaceId!,
  });

  const { data: metadata, isPending: isPendingMetadata } = useQuery({
    type: 'workspace_metadata_list',
    accountId: account.id,
    workspaceId: workspaceId!,
  });

  if (isPendingWorkspace || isPendingMetadata) {
    return null;
  }

  if (!workspace) {
    return <WorkspaceNotFound />;
  }

  if (!workspace) {
    return <WorkspaceNotFound />;
  }

  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        openSettings() {
          setOpenSettings(true);
        },
        getMetadata<K extends WorkspaceMetadataKey>(key: K) {
          const value = metadata?.find((m) => m.key === key);
          if (!value) {
            return undefined;
          }

          if (value.key !== key) {
            return undefined;
          }

          return value as WorkspaceMetadataMap[K];
        },
        setMetadata<K extends WorkspaceMetadataKey>(
          key: K,
          value: WorkspaceMetadataMap[K]['value']
        ) {
          window.colanode.executeMutation({
            type: 'workspace_metadata_save',
            accountId: account.id,
            workspaceId: workspaceId!,
            key,
            value: JSON.stringify(value),
          });
        },
        deleteMetadata(key: string) {
          window.colanode.executeMutation({
            type: 'workspace_metadata_delete',
            accountId: account.id,
            workspaceId: workspaceId!,
            key,
          });
        },
      }}
    >
      <Layout />
      {openSettings && (
        <WorkspaceSettingsDialog
          open={openSettings}
          onOpenChange={() => setOpenSettings(false)}
        />
      )}
    </WorkspaceContext.Provider>
  );
};
