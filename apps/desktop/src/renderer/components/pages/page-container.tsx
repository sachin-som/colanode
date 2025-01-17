import { extractEntryRole, PageEntry } from '@colanode/core';

import { PageBody } from '@/renderer/components/pages/page-body';
import { PageHeader } from '@/renderer/components/pages/page-header';
import { PageNotFound } from '@/renderer/components/pages/page-not-found';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface PageContainerProps {
  pageId: string;
}

export const PageContainer = ({ pageId }: PageContainerProps) => {
  const workspace = useWorkspace();

  const { data: entry, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: pageId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const page = entry as PageEntry;
  const pageExists = !!page;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: page?.rootId ?? '',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: pageExists,
    }
  );

  if (isPendingEntry || (isPendingRoot && pageExists)) {
    return null;
  }

  if (!page || !root) {
    return <PageNotFound />;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return <PageNotFound />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader page={page} role={role} />
      <PageBody page={page} role={role} />
    </div>
  );
};
