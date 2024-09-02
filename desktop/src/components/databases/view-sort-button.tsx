import React from 'react';
import { Icon } from '@/components/ui/icon';

export const ViewSortButton = () => {
  return (
    <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
      <Icon name="sort-desc" />
    </div>
  );
};
