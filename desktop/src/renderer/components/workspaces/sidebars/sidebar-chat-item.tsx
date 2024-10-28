import React from 'react';
import { SidebarChatNode } from '@/types/workspaces';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';

interface SidebarChatItemProps {
  node: SidebarChatNode;
}

export const SidebarChatItem = ({
  node,
}: SidebarChatItemProps): React.ReactNode => {
  const isActive = false;
  const isUnread = node.unreadCount > 0 || node.mentionsCount > 0;

  return (
    <div
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent',
      )}
    >
      <Avatar id={node.id} avatar={node.avatar} name={node.name} size="small" />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold',
        )}
      >
        {node.name ?? 'Unnamed'}
      </span>
      {node.unreadCount > 0 && (
        <span className="rounded-md bg-red-500 px-1 py-0.5 text-xs text-white">
          {node.unreadCount}
        </span>
      )}
    </div>
  );
};
