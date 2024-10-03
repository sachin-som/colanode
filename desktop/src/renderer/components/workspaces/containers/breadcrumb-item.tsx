import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/ui/avatar';
import { BreadcrumbNode } from '@/types/workspaces';

interface BreadcrumbNodeProps {
  node: BreadcrumbNode;
  className?: string;
}

export const BreadcrumbItem = ({ node, className }: BreadcrumbNodeProps) => {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {node.avatar && (
        <Avatar
          size="small"
          id={node.id}
          name={node.name}
          avatar={node.avatar}
        />
      )}
      <span>{node.name ?? 'Unnamed'}</span>
    </div>
  );
};
