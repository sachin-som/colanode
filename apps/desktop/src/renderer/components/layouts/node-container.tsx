import { PageContainer } from '@/renderer/components/pages/page-container';
import { ChannelContainer } from '@/renderer/components/channels/channel-container';
import { DatabaseContainer } from '@/renderer/components/databases/database-container';
import { RecordContainer } from '@/renderer/components/records/record-container';
import { ChatContainer } from '@/renderer/components/chats/chat-container';
import { FolderContainer } from '@/renderer/components/folders/folder-container';
import { FileContainer } from '@/renderer/components/files/file-container';
import { getIdType, IdType } from '@colanode/core';

interface NodeContainerProps {
  nodeId: string;
}

export const NodeContainer = ({ nodeId }: NodeContainerProps) => {
  const idType = getIdType(nodeId);

  switch (idType) {
    case IdType.Channel:
      return <ChannelContainer nodeId={nodeId} />;
    case IdType.Page:
      return <PageContainer nodeId={nodeId} />;
    case IdType.Database:
      return <DatabaseContainer nodeId={nodeId} />;
    case IdType.Record:
      return <RecordContainer nodeId={nodeId} />;
    case IdType.Chat:
      return <ChatContainer nodeId={nodeId} />;
    case IdType.Folder:
      return <FolderContainer nodeId={nodeId} />;
    case IdType.File:
      return <FileContainer nodeId={nodeId} />;
    default:
      return null;
  }
};
