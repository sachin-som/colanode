import React from 'react';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChatContainerNodeProps {
  nodeId: string;
}

export const ChatContainerNode = ({ nodeId }: ChatContainerNodeProps) => {
  return <Conversation conversationId={nodeId} />;
};
