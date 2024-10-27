import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { ChatCreateCommand } from '@/renderer/components/chats/chat-create-command';
import { Plus } from 'lucide-react';

export const ChatCreatePopover = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Plus className="mr-2 size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <ChatCreateCommand />
      </PopoverContent>
    </Popover>
  );
};
