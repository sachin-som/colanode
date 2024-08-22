import React from 'react';
import { MessageList } from '@/components/messages/message-list';
import { MessageCreate } from '@/components/messages/message-create';
import { useConversation } from '@/hooks/use-conversation';
import { observer } from 'mobx-react-lite';

interface ConversationProps {
  nodeId: string;
}

export const Conversation = observer(({ nodeId }: ConversationProps) => {
  const { messages, isLoading, createMessage } = useConversation(nodeId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <React.Fragment>
      <MessageList conversationId={nodeId} messages={messages} />
      <MessageCreate nodeId={nodeId} onSubmit={createMessage} />
    </React.Fragment>
  );
});
