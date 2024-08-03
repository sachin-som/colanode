import React from 'react';

import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const MessageGifPicker = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer">
          <Icon name="file-gif-line" size={20} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="h-128 w-128 mr-6 overflow-hidden p-2"
        side="bottom"
      >
        <p>coming soon.</p>
      </PopoverContent>
    </Popover>
  );
};
