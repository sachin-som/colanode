import React from 'react';
import { SidebarChatNode } from '@/types/workspaces';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { Icon } from '@/renderer/components/ui/icon';

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
        <span className="bg-sidebar-accent text-sidebar-accent-foreground mr-1 rounded-md px-1 py-0.5 text-xs">
          {directCount}
        </span>
      )}
      {directCount == 0 && isUnread && (
        <Icon
          name="checkbox-blank-circle-fill"
          className="mr-2 h-3 w-3 p-0.5 text-red-500"
        />
      )}
    </div>
  );
};
