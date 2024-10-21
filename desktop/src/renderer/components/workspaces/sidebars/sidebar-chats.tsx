import React from 'react';
import { ChatCreatePopover } from '@/renderer/components/chats/chat-create-popover';
import { useQuery } from '@/renderer/hooks/use-query';
import { SidebarChatItem } from '@/renderer/components/workspaces/sidebars/sidebar-chat-item';
import { useWorkspace } from '@/renderer/contexts/workspace';

import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/renderer/components/ui/sidebar';

export const SidebarChats = () => {
  const workspace = useWorkspace();
  const { data } = useQuery({
    type: 'sidebar_chat_list',
    userId: workspace.userId,
  });

  return (
    <SidebarGroup className="group/sidebar-chats group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupAction className="text-muted-foreground opacity-0 transition-opacity group-hover/sidebar-chats:opacity-100">
        <ChatCreatePopover />
      </SidebarGroupAction>
      <SidebarMenu>
        {data?.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              onClick={() => {
                workspace.navigateToNode(item.id);
              }}
            >
              <SidebarChatItem node={item} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};
