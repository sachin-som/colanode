import React from 'react';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChatContainerProps {
  nodeId: string;
}

export const ChatContainer = ({ nodeId }: ChatContainerProps) => {
  return <Conversation conversationId={nodeId} />;
};
