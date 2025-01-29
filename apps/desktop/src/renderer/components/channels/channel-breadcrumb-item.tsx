import { ChannelEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface ChannelBreadcrumbItemProps {
  id: string;
}

export const ChannelBreadcrumbItem = ({ id }: ChannelBreadcrumbItemProps) => {
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

  const channel = data as ChannelEntry;

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={channel.id}
        name={channel.attributes.name}
        avatar={channel.attributes.avatar}
        className="size-4"
      />
      <span>{channel.attributes.name}</span>
    </div>
  );
};
