import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { EmojiPicker } from '@/renderer/components/emojis/emoji-picker';

interface MessageReactionProps {
  onReactionClick: (reaction: string) => void;
}

export const MessageReactionCreatePopover = ({
  onReactionClick,
}: MessageReactionProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Icon name="emoji-sticker-line" />
      </PopoverTrigger>
      <PopoverContent className="w-max p-0" align="end">
        <EmojiPicker
          onEmojiClick={(emoji) => {
            onReactionClick(emoji.id);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
