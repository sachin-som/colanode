import { ChatEntry } from '@colanode/core';
import { InView } from 'react-intersection-observer';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { ReadStateIndicator } from '@/renderer/components/layouts/read-state-indicator';
import { useRadar } from '@/renderer/contexts/radar';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useQuery } from '@/renderer/hooks/use-query';
import { useLayout } from '@/renderer/contexts/layout';
import { cn } from '@/shared/lib/utils';

interface ChatSidebarItemProps {
  chat: ChatEntry;
}

export const ChatSidebarItem = ({ chat }: ChatSidebarItemProps) => {
  const workspace = useWorkspace();
  const layout = useLayout();
  const radar = useRadar();

  const userId =
    Object.keys(chat.attributes.collaborators).find(
      (id) => id !== workspace.userId
    ) ?? '';

  const { data, isPending } = useQuery({
    type: 'user_get',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    userId,
  });

  if (isPending || !data) {
    return null;
  }

  const nodeReadState = radar.getChatState(
    workspace.accountId,
    workspace.id,
    chat.id
  );
  const isActive = layout.activeTab === chat.id;
  const unreadCount =
    nodeReadState.unseenMessagesCount + nodeReadState.mentionsCount;

  return (
    <InView
      rootMargin="20px"
      onChange={(inView) => {
        if (inView) {
          radar.markEntryAsSeen(workspace.accountId, workspace.id, chat.id);
        }
      }}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={data.id}
        avatar={data.avatar}
        name={data.name}
        className="h-5 w-5"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          !isActive && unreadCount > 0 && 'font-semibold'
        )}
      >
        {data.name ?? 'Unnamed'}
      </span>
      {!isActive && (
        <ReadStateIndicator count={unreadCount} hasChanges={unreadCount > 0} />
      )}
    </InView>
  );
};
