import { ChannelEntry } from '@colanode/core';

import { Avatar } from '@/renderer/components/avatars/avatar';

interface ChannelBreadcrumbItemProps {
  channel: ChannelEntry;
}

export const ChannelBreadcrumbItem = ({
  channel,
}: ChannelBreadcrumbItemProps) => {
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
