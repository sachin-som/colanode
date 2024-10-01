import React from 'react';
import { ChatCreatePopover } from '@/components/chats/chat-create-popover';
import { useSidebarChatsQuery } from '@/queries/use-sidebar-chats-query';
import { SidebarChatItem } from './sidebar-chat-item';

export const SidebarChats = () => {
  const { data } = useSidebarChatsQuery();

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
