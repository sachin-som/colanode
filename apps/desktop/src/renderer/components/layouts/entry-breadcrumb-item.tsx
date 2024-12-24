import { Entry } from '@colanode/core';

import { ChannelBreadcrumbItem } from '@/renderer/components/channels/channel-breadcrumb-item';
import { ChatBreadcrumbItem } from '@/renderer/components/chats/chat-breadcrumb-item';
import { DatabaseBreadcrumbItem } from '@/renderer/components/databases/database-breadcrumb-item';
import { FolderBreadcrumbItem } from '@/renderer/components/folders/folder-breadcrumb-item';
import { PageBreadcrumbItem } from '@/renderer/components/pages/page-breadcrumb-item';
import { RecordBreadcrumbItem } from '@/renderer/components/records/record-breadcrumb-item';
import { SpaceBreadcrumbItem } from '@/renderer/components/spaces/space-breadcrumb-item';

interface EntryBreadcrumbItemProps {
  entry: Entry;
}

export const EntryBreadcrumbItem = ({ entry }: EntryBreadcrumbItemProps) => {
  switch (entry.type) {
    case 'space':
      return <SpaceBreadcrumbItem space={entry} />;
    case 'channel':
      return <ChannelBreadcrumbItem channel={entry} />;
    case 'chat':
      return <ChatBreadcrumbItem chat={entry} />;
    case 'page':
      return <PageBreadcrumbItem page={entry} />;
    case 'database':
      return <DatabaseBreadcrumbItem database={entry} />;
    case 'record':
      return <RecordBreadcrumbItem record={entry} />;
    case 'folder':
      return <FolderBreadcrumbItem folder={entry} />;
    default:
      return null;
  }
};
