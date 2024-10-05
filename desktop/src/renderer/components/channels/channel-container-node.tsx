import React from 'react';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChannelContainerNodeProps {
  nodeId: string;
}

export const ChannelContainerNode = ({ nodeId }: ChannelContainerNodeProps) => {
  return <Conversation conversationId={nodeId} />;
};
