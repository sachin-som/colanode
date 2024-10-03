import React from 'react';
import { LocalNode } from '@/types/nodes';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChannelContainerNodeProps {
  node: LocalNode;
}

export const ChannelContainerNode = ({ node }: ChannelContainerNodeProps) => {
  return <Conversation conversationId={node.id} />;
};
