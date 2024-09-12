import React from 'react';
import { Icon } from '@/components/ui/icon';

interface ViewActionButtonProps {
  onClick: () => void;
  icon: string;
}

export const ViewActionButton = ({ onClick, icon }: ViewActionButtonProps) => {
  return (
    <button
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
};
