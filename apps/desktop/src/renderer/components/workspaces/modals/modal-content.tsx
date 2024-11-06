import React from 'react';
import { match } from 'ts-pattern';
import { ChannelContainer } from '@/renderer/components/channels/channel-container';
import { PageContainer } from '@/renderer/components/pages/page-container';
import { DatabaseContainer } from '@/renderer/components/databases/database-container';
import { RecordContainer } from '@/renderer/components/records/record-container';
import { ChatContainer } from '@/renderer/components/chats/chat-container';
import { FolderContainer } from '@/renderer/components/folders/folder-container';
import { FileContainer } from '@/renderer/components/files/file-container';
import { getIdType, IdType } from '@/lib/id';

interface ModalContentProps {
  nodeId: string;
}

export const ModalContent = ({ nodeId }: ModalContentProps) => {
  const idType = getIdType(nodeId);
  return (
    <div className="flex h-full w-full flex-col">
      {match(idType)
        .with(IdType.Channel, () => <ChannelContainer nodeId={nodeId} />)
        .with(IdType.Page, () => <PageContainer nodeId={nodeId} />)
        .with(IdType.Database, () => <DatabaseContainer nodeId={nodeId} />)
        .with(IdType.Record, () => <RecordContainer nodeId={nodeId} />)
        .with(IdType.Chat, () => <ChatContainer nodeId={nodeId} />)
        .with(IdType.Folder, () => <FolderContainer nodeId={nodeId} />)
        .with(IdType.File, () => <FileContainer nodeId={nodeId} />)
        .otherwise(() => null)}
    </div>
  );
};
