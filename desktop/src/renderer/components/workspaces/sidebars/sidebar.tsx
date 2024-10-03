import React from 'react';
import { SidebarHeader } from '@/renderer/components/workspaces/sidebars/sidebar-header';
import { SidebarSpaces } from '@/renderer/components/workspaces/sidebars/sidebar-spaces';
import { SidebarChats } from '@/renderer/components/workspaces/sidebars/sidebar-chats';
import { Icon } from '@/renderer/components/ui/icon';

export const Sidebar = () => {
  return (
    <div className="h-full max-h-screen w-full border-r border-gray-200">
      <SidebarHeader />
      <div className="relative mt-2 max-h-full flex-grow overflow-hidden px-2">
        <div className="flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100">
          <Icon name="search-line" className="mr-2 h-4 w-4" />
          <span>Search</span>
        </div>
        <div className="flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100">
          <Icon name="inbox-line" className="mr-2 h-4 w-4" />
          <span>Inbox</span>
        </div>
        <SidebarChats />
        <SidebarSpaces />
      </div>
    </div>
  );
};
