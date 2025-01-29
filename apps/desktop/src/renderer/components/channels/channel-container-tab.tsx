import { ChannelEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChannelContainerTabProps {
  channelId: string;
}

export const ChannelContainerTab = ({
  channelId,
}: ChannelContainerTabProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'entry_get',
    entryId: channelId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const channel = data as ChannelEntry;
  if (!channel) {
    return <p className="text-sm text-muted-foreground">Not found</p>;
  }

  const name =
    channel.attributes.name && channel.attributes.name.length > 0
      ? channel.attributes.name
      : 'Unnamed';

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={channel.id}
        name={name}
        avatar={channel.attributes.avatar}
      />
      <span>{name}</span>
    </div>
  );
};
