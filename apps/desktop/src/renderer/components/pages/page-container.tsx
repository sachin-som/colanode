import { extractEntryRole, PageEntry } from '@colanode/core';

import { PageBody } from '@/renderer/components/pages/page-body';
import { PageHeader } from '@/renderer/components/pages/page-header';
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
    userId: workspace.userId,
  });

  const page = entry as PageEntry;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: page?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!page?.rootId,
    }
  );

  if (isPendingEntry || isPendingRoot) {
    return null;
  }

  if (!page || !root) {
    return null;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return null;
  }
  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader page={page} role={role} />
      <PageBody page={page} role={role} />
    </div>
  );
};
