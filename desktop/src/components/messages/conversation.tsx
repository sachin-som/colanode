import React from 'react';
import { MessageList } from '@/components/messages/message-list';
import { MessageCreate } from '@/components/messages/message-create';

interface ConversationProps {
  nodeId: string;
}

export const Conversation = ({ nodeId }: ConversationProps) => {
  return (
    <React.Fragment>
      <MessageList nodeId={nodeId} />
      <MessageCreate nodeId={nodeId} />
    </React.Fragment>
  );
};
