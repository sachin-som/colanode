import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChatCreateCommand } from '@/components/chats/chat-create-command';

export const ChatCreatePopover = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="add-line" className="mr-2 h-3 w-3 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <ChatCreateCommand />
      </PopoverContent>
    </Popover>
  );
};
