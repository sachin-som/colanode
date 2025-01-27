import { match } from 'ts-pattern';
import { getIdType, IdType } from '@colanode/core';

import { ContainerTab } from '@/shared/types/workspaces';
import { TabsContent } from '@/renderer/components/ui/tabs';
import { ChannelContainer } from '@/renderer/components/channels/channel-container';
import { ChatContainer } from '@/renderer/components/chats/chat-container';
import { DatabaseContainer } from '@/renderer/components/databases/database-container';
import { FileContainer } from '@/renderer/components/files/file-container';
import { FolderContainer } from '@/renderer/components/folders/folder-container';
import { PageContainer } from '@/renderer/components/pages/page-container';
import { RecordContainer } from '@/renderer/components/records/record-container';

interface ContainerTabContentProps {
  tab: ContainerTab;
}

export const ContainerTabContent = ({ tab }: ContainerTabContentProps) => {
  return (
    <TabsContent
      value={tab.id}
      key={tab.id}
      className="h-full min-h-full w-full min-w-full m-0 pt-2"
    >
      {match(getIdType(tab.id))
        .with(IdType.Channel, () => <ChannelContainer channelId={tab.id} />)
        .with(IdType.Page, () => <PageContainer pageId={tab.id} />)
        .with(IdType.Database, () => <DatabaseContainer databaseId={tab.id} />)
        .with(IdType.Record, () => <RecordContainer recordId={tab.id} />)
        .with(IdType.Chat, () => <ChatContainer chatId={tab.id} />)
        .with(IdType.Folder, () => <FolderContainer folderId={tab.id} />)
        .with(IdType.File, () => <FileContainer fileId={tab.id} />)
        .otherwise(() => null)}
    </TabsContent>
  );
};
