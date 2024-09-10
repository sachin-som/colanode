import React from 'react';
import { SidebarChatNode } from '@/types/workspaces';

interface SidebarChatsProps {
  chats: SidebarChatNode[];
}

export const SidebarChats = ({ chats }: SidebarChatsProps) => {
  return (
    <div className="pt-2 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Chats</span>
      </div>
      <div className="flex flex-col gap-0.5"></div>
    </div>
  );
};
