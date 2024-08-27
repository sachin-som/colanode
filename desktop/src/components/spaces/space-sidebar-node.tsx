import React from 'react';
import { Node } from '@/types/nodes';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { SidebarNodeChildren } from '@/components/workspaces/sidebar-node-children';

interface SpaceSidebarNodeProps {
  node: Node;
}

export const SpaceSidebarNode = ({ node }: SpaceSidebarNodeProps) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const isActive = false;
  const isUnread = false;
  const directCount = 0;

  const avatar = node.attrs.avatar;
  const name = node.attrs.name ?? 'Unnamed';
  return (
    <React.Fragment>
      <div
        key={node.id}
        className={cn(
          'flex cursor-pointer items-center rounded-md p-1 text-sm text-foreground/80 hover:bg-gray-100',
          isActive && 'bg-gray-100',
        )}
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
      {isOpen && (
        <div className="pl-4">
          <SidebarNodeChildren node={node} />
        </div>
      )}
    </React.Fragment>
  );
};
