import React from 'react';
import { MessageList } from '@/components/messages/message-list';
import { MessageCreate } from '@/components/messages/message-create';
import { useConversation } from '@/hooks/use-conversation';
import { observer } from 'mobx-react-lite';

interface ConversationProps {
  nodeId: string;
}

export const Conversation = observer(({ nodeId }: ConversationProps) => {
  const { nodes, isLoading, createMessage } = useConversation(nodeId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <React.Fragment>
      <MessageList conversationId={nodeId} nodes={nodes} />
      <MessageCreate nodeId={nodeId} onSubmit={createMessage} />
    </React.Fragment>
  );
});
