import { Entry } from '@colanode/core';
import React from 'react';

import { ChannelSidebarItem } from '@/renderer/components/channels/channel-sidebar-item';
import { ChatSidebarItem } from '@/renderer/components/chats/chat-sidebar-item';
import { DatabaseSidebarItem } from '@/renderer/components/databases/database-sidiebar-item';
import { FolderSidebarItem } from '@/renderer/components/folders/folder-sidebar-item';
import { PageSidebarItem } from '@/renderer/components/pages/page-sidebar-item';
import { SpaceSidebarItem } from '@/renderer/components/spaces/space-sidebar-item';

interface EntrySidebarItemProps {
  entry: Entry;
}

export const EntrySidebarItem = ({
  entry,
}: EntrySidebarItemProps): React.ReactNode => {
  switch (entry.type) {
    case 'space':
      return <SpaceSidebarItem space={entry} />;
    case 'channel':
      return <ChannelSidebarItem channel={entry} />;
    case 'chat':
      return <ChatSidebarItem chat={entry} />;
    case 'page':
      return <PageSidebarItem page={entry} />;
    case 'database':
      return <DatabaseSidebarItem database={entry} />;
    case 'folder':
      return <FolderSidebarItem folder={entry} />;
    default:
      return null;
  }
};
