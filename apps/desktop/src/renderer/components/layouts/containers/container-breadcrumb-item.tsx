import { getIdType, IdType } from '@colanode/core';

import { ChannelBreadcrumbItem } from '@/renderer/components/channels/channel-breadcrumb-item';
import { ChatBreadcrumbItem } from '@/renderer/components/chats/chat-breadcrumb-item';
import { DatabaseBreadcrumbItem } from '@/renderer/components/databases/database-breadcrumb-item';
import { FolderBreadcrumbItem } from '@/renderer/components/folders/folder-breadcrumb-item';
import { PageBreadcrumbItem } from '@/renderer/components/pages/page-breadcrumb-item';
import { RecordBreadcrumbItem } from '@/renderer/components/records/record-breadcrumb-item';
import { SpaceBreadcrumbItem } from '@/renderer/components/spaces/space-breadcrumb-item';
import { FileBreadcrumbItem } from '@/renderer/components/files/file-breadcrumb-item';
import { MessageBreadcrumbItem } from '@/renderer/components/messages/message-breadcrumb-item';

interface ContainerBreadcrumbItemProps {
  id: string;
}

export const ContainerBreadcrumbItem = ({
  id,
}: ContainerBreadcrumbItemProps) => {
  const idType = getIdType(id);

  switch (idType) {
    case IdType.Space:
      return <SpaceBreadcrumbItem id={id} />;
    case IdType.Channel:
      return <ChannelBreadcrumbItem id={id} />;
    case IdType.Chat:
      return <ChatBreadcrumbItem id={id} />;
    case IdType.Page:
      return <PageBreadcrumbItem id={id} />;
    case IdType.Database:
      return <DatabaseBreadcrumbItem id={id} />;
    case IdType.Record:
      return <RecordBreadcrumbItem id={id} />;
    case IdType.Folder:
      return <FolderBreadcrumbItem id={id} />;
    case IdType.File:
      return <FileBreadcrumbItem id={id} />;
    case IdType.Message:
      return <MessageBreadcrumbItem id={id} />;
    default:
      return null;
  }
};
