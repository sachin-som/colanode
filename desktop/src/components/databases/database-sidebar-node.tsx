import React from 'react';
import { LocalNode } from '@/types/nodes';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useWorkspace } from '@/contexts/workspace';

interface DatabaseSidebarNodeProps {
  node: LocalNode;
}

export const DatabaseSidebarNode = ({ node }: DatabaseSidebarNodeProps) => {
  const workspace = useWorkspace();
  const isActive = false;
  const isUnread = false;

  const avatar = node.attrs.avatar;
  const name = node.attrs.name ?? 'Unnamed';
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
      <Avatar id={node.id} avatar={avatar} name={name} size="small" />
      <span
        className={cn(
          'line-clamp-1 w-full flex-grow pl-2 text-left',
          isUnread && 'font-bold',
        )}
      >
        {name}
      </span>
      {isUnread && (
        <Icon
          name="checkbox-blank-circle-fill"
          className="mr-2 h-3 w-3 p-0.5 text-red-500"
        />
      )}
    </div>
  );
};
