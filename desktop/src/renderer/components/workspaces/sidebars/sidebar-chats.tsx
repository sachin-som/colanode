import React from 'react';
import { ChatCreatePopover } from '@/renderer/components/chats/chat-create-popover';
import { useQuery } from '@/renderer/hooks/use-query';
import { SidebarChatItem } from '@/renderer/components/workspaces/sidebars/sidebar-chat-item';
import { useWorkspace } from '@/renderer/contexts/workspace';

export const SidebarChats = () => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'sidebar_chat_list',
    userId: workspace.userId,
  });

  return (
    <div className="pt-2 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Chats</span>
        <ChatCreatePopover />
      </div>
      <div className="flex flex-col gap-0.5">
        {data?.map((chat) => <SidebarChatItem key={chat.id} node={chat} />)}
      </div>
    </div>
  );
};
