import React from 'react';
import { SidebarNode } from '@/types/workspaces';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';

interface SidebarItemProps {
  node: SidebarNode;
  isActive?: boolean;
}

export const SidebarItem = ({
  node,
  isActive,
}: SidebarItemProps): React.ReactNode => {
  const isUnread =
    !isActive && (node.unreadCount > 0 || node.mentionsCount > 0);

  return (
    <button
      key={node.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent',
      )}
    >
      <Avatar
        id={node.id}
        avatar={node.avatar}
        name={node.name}
        className="h-4 w-4"
      />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold',
        )}
      >
        {node.name ?? 'Unnamed'}
      </span>
      {node.mentionsCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {node.mentionsCount}
        </span>
      )}
      {node.mentionsCount == 0 && isUnread && (
        <span className="size-2 rounded-full bg-red-500" />
      )}
    </button>
  );
};
