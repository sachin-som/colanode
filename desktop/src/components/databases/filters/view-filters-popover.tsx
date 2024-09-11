import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const ViewFiltersPopover = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
          <Icon name="filter-line" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="mr-4 flex w-[600px] flex-col gap-1.5 p-2"
      >
        filters goes here
      </PopoverContent>
    </Popover>
  );
};
