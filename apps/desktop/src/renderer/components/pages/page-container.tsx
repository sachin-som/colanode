import { extractEntryRole } from '@colanode/core';

import { PageBody } from '@/renderer/components/pages/page-body';
import { PageHeader } from '@/renderer/components/pages/page-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface PageContainerProps {
  pageId: string;
}

export const PageContainer = ({ pageId }: PageContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'entry_tree_get',
    entryId: pageId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const entries = data ?? [];
  const page = entries.find((entry) => entry.id === pageId);
  const role = extractEntryRole(entries, workspace.userId);

  if (!page || page.type !== 'page' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <PageHeader entries={entries} page={page} role={role} />
      <PageBody page={page} role={role} />
    </div>
  );
};
