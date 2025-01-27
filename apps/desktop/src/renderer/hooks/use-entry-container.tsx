import { Entry, EntryRole, extractEntryRole } from '@colanode/core';

import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

type UseEntryContainerResult<T extends Entry> =
  | {
      isPending: true;
      entry: null;
    }
  | {
      isPending: false;
      entry: null;
    }
  | {
      isPending: false;
      entry: T;
      breadcrumb: string[];
      root: Entry;
      role: EntryRole;
    };

export const useEntryContainer = <T extends Entry>(
  id: string
): UseEntryContainerResult<T> => {
  const workspace = useWorkspace();

  const { data: entryData, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const entryExists = !!entryData;
  const isRoot = entryData?.rootId === id;

  const { data: rootData, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: entryData?.rootId ?? '',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: entryExists && !isRoot,
    }
  );

  const { data: breadcrumbData, isPending: isPendingBreadcrumb } = useQuery(
    {
      type: 'entry_breadcrumb_get',
      entryId: id,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: entryExists && !isRoot,
    }
  );

  const isPending =
    isPendingEntry ||
    (entryExists && !isRoot && (isPendingRoot || isPendingBreadcrumb));

  if (isPending) {
    return { isPending: true, entry: null };
  }

  if (!entryExists) {
    return { isPending: false, entry: null };
  }

  if (isRoot) {
    const role = extractEntryRole(entryData, workspace.userId);
    if (!role) {
      return { isPending: false, entry: null };
    }

    return {
      isPending: false,
      entry: entryData as T,
      root: entryData,
      breadcrumb: [entryData.id],
      role,
    };
  }

  if (!rootData) {
    return { isPending: false, entry: null };
  }

  if (!breadcrumbData || breadcrumbData.length === 0) {
    return { isPending: false, entry: null };
  }

  const role = extractEntryRole(rootData, workspace.userId);
  if (!role) {
    return { isPending: false, entry: null };
  }

  return {
    isPending: false,
    entry: entryData as T,
    root: rootData,
    breadcrumb: breadcrumbData,
    role,
  };
};
