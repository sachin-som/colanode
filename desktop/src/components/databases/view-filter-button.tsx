import React from 'react';
import { Icon } from '@/components/ui/icon';

export const ViewFilterButton = () => {
  return (
    <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
      <Icon name="filter-line" />
    </div>
  );
};
