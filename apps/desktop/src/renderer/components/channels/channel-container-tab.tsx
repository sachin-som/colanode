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

  const { data: entry } = useQuery({
    type: 'entry_get',
    entryId: channelId,
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const channel = entry as ChannelEntry;
  if (!channel) {
    return <p>Not found</p>;
  }

  return (
    <div className="flex items-center space-x-2">
      <Avatar
        size="small"
        id={channel.id}
        name={channel.attributes.name}
        avatar={channel.attributes.avatar}
      />
      <span>{channel.attributes.name}</span>
    </div>
  );
};
