import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/avatars/avatar';
import { BreadcrumbNode } from '@/types/workspaces';
import { NodeTypes } from '@colanode/core';

interface BreadcrumbNodeProps {
  node: BreadcrumbNode;
  className?: string;
}

export const BreadcrumbItem = ({ node, className }: BreadcrumbNodeProps) => {
  let name = node.name ?? 'Unnamed';
  if (node.type === NodeTypes.Message) {
    name = 'Message';
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {node.avatar && (
        <Avatar
          size="small"
          id={node.id}
          name={node.name}
          avatar={node.avatar}
        />
      )}
      <span>{name}</span>
    </div>
  );
};
