import { SpaceEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface SpaceBreadcrumbItemProps {
  id: string;
}

export const SpaceBreadcrumbItem = ({ id }: SpaceBreadcrumbItemProps) => {
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

  const space = data as SpaceEntry;
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={space.id}
        name={space.attributes.name}
        avatar={space.attributes.avatar}
        className="size-4"
      />
      <span>{space.attributes.name}</span>
    </div>
  );
};
