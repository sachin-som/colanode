import { SpaceEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface SpaceContainerTabProps {
  spaceId: string;
}

export const SpaceContainerTab = ({ spaceId }: SpaceContainerTabProps) => {
  const workspace = useWorkspace();

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: spaceId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const space = entry as SpaceEntry;
  if (!space) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={space.id}
        name={space.attributes.name}
        avatar={space.attributes.avatar}
      />
      <span>{space.attributes.name}</span>
    </div>
  );
};
