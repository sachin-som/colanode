import React from 'react';
import { useWorkspace } from '@/contexts/workspace';
import { SidebarNode } from '@/types/workspaces';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';

interface SidebarItemProps {
  node: SidebarNode;
}

export const SidebarItem = ({ node }: SidebarItemProps): React.ReactNode => {
  const workspace = useWorkspace();
  const isActive = false;
  const isUnread = false;
  const directCount = 0;

  return (
    <div
      key={node.id}
      className={cn(
        'flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100',
        isActive && 'bg-gray-100',
      )}
      onClick={() => {
        workspace.navigateToNode(node.id);
      }}
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
        <span className="mr-1 rounded-md bg-red-500 px-1 py-0.5 text-xs text-white">
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
