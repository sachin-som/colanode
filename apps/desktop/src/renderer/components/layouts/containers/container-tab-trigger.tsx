import React from 'react';
import { match } from 'ts-pattern';
import { getIdType, IdType } from '@colanode/core';
import { X } from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';

import { TabsTrigger } from '@/renderer/components/ui/tabs';
import { ContainerTab } from '@/shared/types/workspaces';
import { cn } from '@/shared/lib/utils';
import { ChannelContainerTab } from '@/renderer/components/channels/channel-container-tab';
import { FileContainerTab } from '@/renderer/components/files/file-container-tab';
import { DatabaseContainerTab } from '@/renderer/components/databases/database-container-tab';
import { RecordContainerTab } from '@/renderer/components/records/record-container-tab';
import { FolderContainerTab } from '@/renderer/components/folders/folder-container-tab';
import { ChatContainerTab } from '@/renderer/components/chats/chat-container-tab';
import { PageContainerTab } from '@/renderer/components/pages/page-container-tab';

interface ContainerTabTriggerProps {
  tab: ContainerTab;
  onClose: () => void;
  onMove: (before: string | null) => void;
}

export const ContainerTabTrigger = ({
  tab,
  onClose,
  onMove,
}: ContainerTabTriggerProps) => {
  const [, dragRef] = useDrag<string>({
    type: 'container-tab',
    item: tab.id,
    canDrag: () => true,
    end: (_item, monitor) => {
      const dropResult = monitor.getDropResult<{ before: string | null }>();
      if (!dropResult) {
        return;
      }

      onMove(dropResult.before);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [dropMonitor, dropRef] = useDrop({
    accept: 'container-tab',
    drop: () => ({
      before: tab.id,
    }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dragDropRef = dragRef(dropRef(buttonRef));

  return (
    <TabsTrigger
      value={tab.id}
      key={tab.id}
      className={cn(
        'overflow-hidden rounded-b-none bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none h-10 group/tab app-no-drag-region flex items-center justify-between gap-2',
        tab.preview && 'italic',
        dropMonitor.isOver &&
          dropMonitor.canDrop &&
          'border-l-2 border-blue-300'
      )}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
      ref={dragDropRef as React.LegacyRef<HTMLButtonElement>}
    >
      <div className="overflow-hidden truncate">
        {match(getIdType(tab.id))
          .with(IdType.Channel, () => (
            <ChannelContainerTab channelId={tab.id} />
          ))
          .with(IdType.Page, () => <PageContainerTab pageId={tab.id} />)
          .with(IdType.Database, () => (
            <DatabaseContainerTab databaseId={tab.id} />
          ))
          .with(IdType.Record, () => <RecordContainerTab recordId={tab.id} />)
          .with(IdType.Chat, () => <ChatContainerTab chatId={tab.id} />)
          .with(IdType.Folder, () => <FolderContainerTab folderId={tab.id} />)
          .with(IdType.File, () => <FileContainerTab fileId={tab.id} />)
          .otherwise(() => null)}
      </div>
      <div
        className="opacity-0 group-hover/tab:opacity-100 group-data-[state=active]/tab:opacity-100 transition-opacity duration-200 flex-shrink-0"
        onClick={() => onClose()}
      >
        <X className="size-4 text-muted-foreground hover:text-primary" />
      </div>
    </TabsTrigger>
  );
};
