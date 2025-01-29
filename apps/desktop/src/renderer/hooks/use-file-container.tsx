import { Entry, EntryRole, extractEntryRole } from '@colanode/core';

import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { FileWithState } from '@/shared/types/files';

type UseFileContainerResult =
  | {
      isPending: true;
      file: null;
    }
  | {
      isPending: false;
      file: null;
    }
  | {
      isPending: false;
      file: FileWithState;
      breadcrumb: string[];
      root: Entry;
      role: EntryRole;
    };

export const useFileContainer = (id: string): UseFileContainerResult => {
  const workspace = useWorkspace();

  const { data: fileData, isPending: isPendingFile } = useQuery({
    type: 'file_get',
    id: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const fileExists = !!fileData;

  const { data: rootData, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: fileData?.rootId ?? '',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: fileExists,
    }
  );

  const { data: breadcrumbData, isPending: isPendingBreadcrumb } = useQuery(
    {
      type: 'file_breadcrumb_get',
      fileId: id,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: fileExists,
    }
  );

  const isPending =
    isPendingFile || (fileExists && (isPendingRoot || isPendingBreadcrumb));

  if (isPending) {
    return { isPending: true, file: null };
  }

  if (!fileExists) {
    return { isPending: false, file: null };
  }

  if (!rootData) {
    return { isPending: false, file: null };
  }

  if (!breadcrumbData || breadcrumbData.length === 0) {
    return { isPending: false, file: null };
  }

  const role = extractEntryRole(rootData, workspace.userId);
  if (!role) {
    return { isPending: false, file: null };
  }

  return {
    isPending: false,
    file: fileData,
    root: rootData,
    breadcrumb: breadcrumbData,
    role,
  };
};
