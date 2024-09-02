import React from 'react';
import { cn } from '@/lib/utils';
import { LocalNode } from '@/types/nodes';
import { Avatar } from '@/components/ui/avatar';

interface ViewTabProps {
  view: LocalNode;
  isActive: boolean;
  onClick: () => void;
}

export const ViewTab = ({ view, isActive, onClick }: ViewTabProps) => {
  const name = view.attrs?.name ?? 'Unnamed View';
  return (
    <div
      role="presentation"
      className={cn(
        'inline-flex cursor-pointer flex-row items-center gap-1 border-b-2 p-1 pl-0 text-sm',
        isActive ? 'border-gray-500' : 'border-transparent',
      )}
      onClick={() => onClick()}
      onKeyDown={() => onClick()}
    >
      <Avatar id={view.id} name={name} size="small" />
      {name}
    </div>
  );
};
