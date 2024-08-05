import React from 'react';
import { Node } from '@/types/nodes';
import { Avatar } from '@/components/ui/avatar';

interface ContainerHeaderProps {
  node: Node;
}

export const ContainerHeader = ({ node }: ContainerHeaderProps) => {
  const name = node.attrs.name ?? 'Untitled';
  const avatar = node.attrs.avatar;
  return (
    <div className="mb-1 flex h-12 items-center justify-between border-b-2 border-gray-100 p-2 text-foreground/80">
      <div className="flex flex-row items-center gap-2">
        <Avatar id={node.id} name={name} avatar={avatar} className="h-6 w-6" />
        <p>{name}</p>
      </div>
    </div>
  );
};
