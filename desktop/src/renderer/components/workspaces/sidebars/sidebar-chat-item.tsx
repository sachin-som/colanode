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
  const isUnread = false;
  const directCount = 0;

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
      {directCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {directCount}
        </span>
      )}
      {directCount == 0 && isUnread && (
        <span className="mr-2 size-3 rounded-full bg-red-500 p-0.5" />
      )}
    </div>
  );
};
