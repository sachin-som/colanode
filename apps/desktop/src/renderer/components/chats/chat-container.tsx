import { extractEntryRole } from '@colanode/core';

import { ChatBody } from '@/renderer/components/chats/chat-body';
import { ChatHeader } from '@/renderer/components/chats/chat-header';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';

interface ChatContainerProps {
  chatId: string;
}

export const ChatContainer = ({ chatId }: ChatContainerProps) => {
  const workspace = useWorkspace();

  const { data, isPending } = useQuery({
    type: 'entry_get',
    entryId: chatId,
    userId: workspace.userId,
  });

  if (isPending) {
    return null;
  }

  const node = data;
  if (!node || node.type !== 'chat') {
    return null;
  }

  const role = extractEntryRole(node, workspace.userId);
  if (!role) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader chat={node} role={role} />
      <ChatBody chat={node} role={role} />
    </div>
  );
};
