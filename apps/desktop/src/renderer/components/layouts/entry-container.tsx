import { getIdType, IdType } from '@colanode/core';

import { ChannelContainer } from '@/renderer/components/channels/channel-container';
import { ChatContainer } from '@/renderer/components/chats/chat-container';
import { DatabaseContainer } from '@/renderer/components/databases/database-container';
import { FileContainer } from '@/renderer/components/files/file-container';
import { FolderContainer } from '@/renderer/components/folders/folder-container';
import { PageContainer } from '@/renderer/components/pages/page-container';
import { RecordContainer } from '@/renderer/components/records/record-container';

interface EntryContainerProps {
  entryId: string;
}

export const EntryContainer = ({ entryId }: EntryContainerProps) => {
  const idType = getIdType(entryId);

  switch (idType) {
    case IdType.Channel:
      return <ChannelContainer channelId={entryId} />;
    case IdType.Page:
      return <PageContainer pageId={entryId} />;
    case IdType.Database:
      return <DatabaseContainer databaseId={entryId} />;
    case IdType.Record:
      return <RecordContainer recordId={entryId} />;
    case IdType.Chat:
      return <ChatContainer chatId={entryId} />;
    case IdType.Folder:
      return <FolderContainer folderId={entryId} />;
    case IdType.File:
      return <FileContainer fileId={entryId} />;
    default:
      return null;
  }
};
