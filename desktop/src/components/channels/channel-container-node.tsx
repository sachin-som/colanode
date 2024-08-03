import React from 'react';
import { Node } from '@/types/nodes';
import { Conversation } from '@/components/messages/conversation';

interface ChannelContainerNodeProps {
  node: Node;
}

export const ChannelContainerNode = ({ node }: ChannelContainerNodeProps) => {
  return <Conversation nodeId={node.id} />;
};
