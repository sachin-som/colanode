import { ChatEntry, EntryRole } from '@colanode/core';
import { useEffect } from 'react';

import { Conversation } from '@/renderer/components/messages/conversation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRadar } from '@/renderer/contexts/radar';

interface ChatBodyProps {
  chat: ChatEntry;
  role: EntryRole;
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

  return (
    <Conversation conversationId={chat.id} rootId={chat.rootId} role={role} />
  );
};
