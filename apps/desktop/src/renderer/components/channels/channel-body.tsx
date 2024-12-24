import { ChannelEntry, EntryRole } from '@colanode/core';
import { useEffect } from 'react';

import { Conversation } from '@/renderer/components/messages/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';

interface ChannelBodyProps {
  channel: ChannelEntry;
  role: EntryRole;
}

export const ChannelBody = ({ channel, role }: ChannelBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    radar.markAsOpened(
      workspace.userId,
      channel.id,
      channel.type,
      channel.transactionId
    );

    const interval = setInterval(() => {
      radar.markAsOpened(
        workspace.userId,
        channel.id,
        channel.type,
        channel.transactionId
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [channel.id, channel.type, channel.transactionId]);

  return (
    <Conversation
      conversationId={channel.id}
      rootId={channel.rootId}
      role={role}
    />
  );
};
