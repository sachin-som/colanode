import { ChannelEntry, extractEntryRole } from '@colanode/core';

import { ChannelBody } from '@/renderer/components/channels/channel-body';
import { ChannelHeader } from '@/renderer/components/channels/channel-header';
import { ChannelNotFound } from '@/renderer/components/channels/channel-not-found';
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
    accountId: workspace.accountId,
    workspaceId: workspace.id,
  });

  const channel = entry as ChannelEntry;
  const channelExists = !!channel;

  const { data: root, isPending: isPendingRoot } = useQuery(
    {
      type: 'entry_get',
      entryId: channel?.rootId ?? '',
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: channelExists,
    }
  );

  if (isPendingEntry || (isPendingRoot && channelExists)) {
    return null;
  }

  if (!channel || !root) {
    return <ChannelNotFound />;
  }

  const role = extractEntryRole(root, workspace.userId);
  if (!role) {
    return <ChannelNotFound />;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChannelHeader channel={channel} role={role} />
      <ChannelBody channel={channel} role={role} />
    </div>
  );
};
