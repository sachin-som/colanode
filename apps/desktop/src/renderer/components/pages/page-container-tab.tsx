import { PageEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface PageContainerTabProps {
  pageId: string;
}

export const PageContainerTab = ({ pageId }: PageContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: pageId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const page = entry as PageEntry;
  if (!page) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={page.id}
        name={page.attributes.name}
        avatar={page.attributes.avatar}
      />
      <span>{page.attributes.name}</span>
    </div>
  );
};
