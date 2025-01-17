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
    radar.markEntryAsOpened(workspace.accountId, workspace.id, chat.id);

    const interval = setInterval(() => {
      radar.markEntryAsOpened(workspace.accountId, workspace.id, chat.id);
    }, 60000);

    return () => clearInterval(interval);
  }, [chat.id, chat.type, chat.transactionId]);

  return (
    <Conversation conversationId={chat.id} rootId={chat.rootId} role={role} />
  );
};
