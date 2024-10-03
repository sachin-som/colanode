import React from 'react';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import { SelectOptionNode } from '@/types/databases';

interface BoardViewColumnHeaderProps {
  option: SelectOptionNode;
}

export const BoardViewColumnHeader = ({
  option,
}: BoardViewColumnHeaderProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <SelectOptionBadge name={option.name} color={option.color} />
    </div>
  );
};
