import { X } from 'lucide-react';
import { match } from 'ts-pattern';
import { getIdType, IdType } from '@colanode/core';

import { ScrollArea, ScrollBar } from '@/renderer/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { cn } from '@/shared/lib/utils';
import { ChannelContainer } from '@/renderer/components/channels/channel-container';
import { ChatContainer } from '@/renderer/components/chats/chat-container';
import { DatabaseContainer } from '@/renderer/components/databases/database-container';
import { FileContainer } from '@/renderer/components/files/file-container';
import { FolderContainer } from '@/renderer/components/folders/folder-container';
import { PageContainer } from '@/renderer/components/pages/page-container';
import { RecordContainer } from '@/renderer/components/records/record-container';
import { ChannelContainerTab } from '@/renderer/components/channels/channel-container-tab';
import { DatabaseContainerTab } from '@/renderer/components/databases/database-container-tab';
import { FileContainerTab } from '@/renderer/components/files/file-container-tab';
import { FolderContainerTab } from '@/renderer/components/folders/folder-container-tab';
import { PageContainerTab } from '@/renderer/components/pages/page-container-tab';
import { RecordContainerTab } from '@/renderer/components/records/record-container-tab';
import { ChatContainerTab } from '@/renderer/components/chats/chat-container-tab';
import { ContainerTab } from '@/shared/types/workspaces';

interface LayoutTabsProps {
  tabs: ContainerTab[];
  onTabChange: (value: string) => void;
  onFocus: () => void;
  onClose: (value: string) => void;
}

export const LayoutTabs = ({
  tabs,
  onTabChange,
  onFocus,
  onClose,
}: LayoutTabsProps) => {
  const activeTab = tabs.find((t) => t.active)?.id;

  return (
    <Tabs
      defaultValue={tabs[0]?.id}
      value={activeTab}
      onValueChange={onTabChange}
      onFocus={onFocus}
      className="h-full min-h-full w-full min-w-full flex flex-col"
    >
      <ScrollArea>
        <TabsList className="h-10 bg-slate-50 w-full justify-start p-0 app-drag-region">
          {tabs.map((tab) => (
            <TabsTrigger
              value={tab.id}
              key={tab.id}
              className={cn(
                'overflow-hidden rounded-b-none bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none h-10 group/tab app-no-drag-region',
                tab.preview && 'italic'
              )}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  onClose(tab.id);
                }
              }}
            >
              {match(getIdType(tab.id))
                .with(IdType.Channel, () => (
                  <ChannelContainerTab channelId={tab.id} />
                ))
                .with(IdType.Page, () => <PageContainerTab pageId={tab.id} />)
                .with(IdType.Database, () => (
                  <DatabaseContainerTab databaseId={tab.id} />
                ))
                .with(IdType.Record, () => (
                  <RecordContainerTab recordId={tab.id} />
                ))
                .with(IdType.Chat, () => <ChatContainerTab chatId={tab.id} />)
                .with(IdType.Folder, () => (
                  <FolderContainerTab folderId={tab.id} />
                ))
                .with(IdType.File, () => <FileContainerTab fileId={tab.id} />)
                .otherwise(() => null)}

              <div
                className="opacity-0 group-hover/tab:opacity-100 group-data-[state=active]/tab:opacity-100 transition-opacity duration-200"
                onClick={() => onClose(tab.id)}
              >
                <X className="size-4 text-muted-foreground ml-2 hover:text-primary" />
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="flex-grow overflow-hidden">
        {tabs.map((tab) => (
          <TabsContent
            value={tab.id}
            key={tab.id}
            className="h-full min-h-full w-full min-w-full m-0 pt-2"
          >
            {match(getIdType(tab.id))
              .with(IdType.Channel, () => (
                <ChannelContainer channelId={tab.id} />
              ))
              .with(IdType.Page, () => <PageContainer pageId={tab.id} />)
              .with(IdType.Database, () => (
                <DatabaseContainer databaseId={tab.id} />
              ))
              .with(IdType.Record, () => <RecordContainer recordId={tab.id} />)
              .with(IdType.Chat, () => <ChatContainer chatId={tab.id} />)
              .with(IdType.Folder, () => <FolderContainer folderId={tab.id} />)
              .with(IdType.File, () => <FileContainer fileId={tab.id} />)
              .otherwise(() => null)}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};
