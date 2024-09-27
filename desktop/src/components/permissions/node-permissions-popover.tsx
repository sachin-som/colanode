import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Icon } from '@/components/ui/icon';

interface NodePermissionsPopoverProps {
  id: string;
}

export const NodePermissionsPopover = ({ id }: NodePermissionsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span>
          <Icon
            name="user-add-line"
            className="h-5 w-5 cursor-pointer text-muted-foreground"
          />
        </span>
      </PopoverTrigger>
      <PopoverContent className="mr-2 max-h-128 w-128 overflow-auto">
        <div>Permissions listed here.</div>
      </PopoverContent>
    </Popover>
  );
};
