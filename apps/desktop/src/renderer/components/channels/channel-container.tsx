import { extractEntryRole } from '@colanode/core';

import { ChannelBody } from '@/renderer/components/channels/channel-body';
import { ChannelHeader } from '@/renderer/components/channels/channel-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChannelContainerProps {
  channelId: string;
}

export const ChannelContainer = ({ channelId }: ChannelContainerProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    type: 'entry_tree_get',
    entryId: channelId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const entries = data ?? [];
  const channel = entries.find((entry) => entry.id === channelId);
  const role = extractEntryRole(entries, workspace.userId);

  if (!channel || channel.type !== 'channel' || !role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChannelHeader entries={entries} channel={channel} role={role} />
      <ChannelBody channel={channel} role={role} />
    </div>
  );
};
