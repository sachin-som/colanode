import { ChatNode } from '@colanode/core';
import { Conversation } from '@/renderer/components/messages/conversation';

interface ChatBodyProps {
  chat: ChatNode;
}

export const ChatBody = ({ chat }: ChatBodyProps) => {
  return <Conversation conversationId={chat.id} />;
};
