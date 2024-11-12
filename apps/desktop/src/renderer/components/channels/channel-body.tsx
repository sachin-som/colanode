import { ChannelNode } from '@colanode/core';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChannelBodyProps {
  channel: ChannelNode;
}

export const ChannelBody = ({ channel }: ChannelBodyProps) => {
  return <Conversation conversationId={channel.id} />;
};
