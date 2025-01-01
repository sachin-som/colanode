import { ChannelEntry, extractEntryRole } from '@colanode/core';

import { ChannelBody } from '@/renderer/components/channels/channel-body';
import { ChannelHeader } from '@/renderer/components/channels/channel-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChannelContainerProps {
  channelId: string;
}

export const ChannelContainer = ({ channelId }: ChannelContainerProps) => {
  const workspace = useWorkspace();

  const { data: entry, isPending: isPendingEntry } = useQuery({
    type: 'entry_get',
    entryId: channelId,
    userId: workspace.userId,
  });

  const channel = entry as ChannelEntry;
  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: channel?.rootId ?? '',
      userId: workspace.userId,
    },
    {
      enabled: !!channel?.rootId,
    }
  );

  if (isPendingEntry || isPendingRoot) {
    return null;
  }

  if (!channel || !root) {
    return null;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChannelHeader channel={channel} role={role} />
      <ChannelBody channel={channel} role={role} />
    </div>
  );
};
