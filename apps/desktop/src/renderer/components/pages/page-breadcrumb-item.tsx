import { PageEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface PageBreadcrumbItemProps {
  id: string;
}

export const PageBreadcrumbItem = ({ id }: PageBreadcrumbItemProps) => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'entry_get',
    entryId: id,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (!data) {
    return null;
  }

  const page = data as PageEntry;

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={page.id}
        name={page.attributes.name}
        avatar={page.attributes.avatar}
        className="size-4"
      />
      <span>{page.attributes.name}</span>
    </div>
  );
};
