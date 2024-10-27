import React from 'react';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { SidebarNode } from '@/types/workspaces';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';

interface SidebarItemProps {
  node: SidebarNode;
}

export const SidebarItem = ({ node }: SidebarItemProps): React.ReactNode => {
  const workspace = useWorkspace();
  const isActive = false;
  const isUnread = false;
  const directCount = 0;

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
      {directCount > 0 && (
        <span className="mr-1 rounded-md bg-sidebar-accent px-1 py-0.5 text-xs text-sidebar-accent-foreground">
          {directCount}
        </span>
      )}
      {directCount == 0 && isUnread && (
        <span className="mr-2 size-3 rounded-full bg-red-500 p-0.5" />
      )}
    </button>
  );
};
