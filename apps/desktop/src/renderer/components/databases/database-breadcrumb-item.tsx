import { DatabaseEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DatabaseBreadcrumbItemProps {
  id: string;
}

export const DatabaseBreadcrumbItem = ({ id }: DatabaseBreadcrumbItemProps) => {
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
  const database = data as DatabaseEntry;
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={database.id}
        name={database.attributes.name}
        avatar={database.attributes.avatar}
        className="size-4"
      />
      <span>{database.attributes.name}</span>
    </div>
  );
};
