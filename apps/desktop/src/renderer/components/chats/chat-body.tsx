import { ChatNode, NodeRole } from '@colanode/core';
import { useEffect } from 'react';

import { Conversation } from '@/renderer/components/messages/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';

interface ChatBodyProps {
  chat: ChatNode;
  role: NodeRole;
}

export const ChatBody = ({ chat, role }: ChatBodyProps) => {
  const workspace = useWorkspace();
  const radar = useRadar();

  useEffect(() => {
    radar.markAsOpened(
      workspace.userId,
      chat.id,
      chat.type,
      chat.transactionId
    );

    const interval = setInterval(() => {
      radar.markAsOpened(
        workspace.userId,
        chat.id,
        chat.type,
        chat.transactionId
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [chat.id, chat.type, chat.transactionId]);

  return <Conversation conversationId={chat.id} role={role} />;
};
