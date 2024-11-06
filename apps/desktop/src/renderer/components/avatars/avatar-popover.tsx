import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { AvatarPicker } from './avatar-picker';

interface AvatarPopoverProps {
  onPick: (avatar: string) => void;
  children: React.ReactNode;
}

export const AvatarPopover = ({ onPick, children }: AvatarPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-max p-0">
        <AvatarPicker onPick={onPick} />
      </PopoverContent>
    </Popover>
  );
};
