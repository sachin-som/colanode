import React from 'react';
import { Node } from '@colanode/core';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';
import { ChannelSidebarItem } from '@/renderer/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { PageSidebarItem } from '@/renderer/components/pages/page-sidebar-item';
import { DatabaseSidebarItem } from '@/renderer/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@/renderer/components/folders/folder-sidebar-item';

interface SidebarItemProps {
  node: Node;
}

export const SidebarItem = ({ node }: SidebarItemProps): React.ReactNode => {
  switch (node.type) {
    case 'space':
      return <SpaceSidebarItem node={node} />;
    case 'channel':
      return <ChannelSidebarItem node={node} />;
    case 'chat':
      return <ChatSidebarItem node={node} />;
    case 'page':
      return <PageSidebarItem node={node} />;
    case 'database':
      return <DatabaseSidebarItem node={node} />;
    case 'folder':
      return <FolderSidebarItem node={node} />;
    default:
      return null;
  }
};
