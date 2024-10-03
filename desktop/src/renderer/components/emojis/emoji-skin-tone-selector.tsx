import React from 'react';
import { getEmojiUrl } from '@/lib/emojis';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';

const skins: string[] = [
  '01h37jbxq11hpcnw1mdfgmm70vem',
  '01h37jbxq11hpcnw1mdfgmm70wem',
  '01h37jbxq11hpcnw1mdfgmm70xem',
  '01h37jbxq11hpcnw1mdfgmm70yem',
  '01h37jbxq11hpcnw1mdfgmm70zem',
  '01h37jbxq11hpcnw1mdfgmm710em',
];

interface EmojiSkinToneSelectorProps {
  skinTone: number;
  onSkinToneChange: (skinTone: number) => void;
}

export const EmojiSkinToneSelector = ({
  skinTone,
  onSkinToneChange,
}: EmojiSkinToneSelectorProps) => {
  const [open, setOpen] = React.useState<boolean>(false);

  const handleSkinToneSelection = (skinTone: number) => {
    setOpen(false);
    onSkinToneChange?.(skinTone);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex h-[32px] w-6 items-center justify-center p-1 hover:bg-gray-50 ${
            open && 'bg-gray-100'
          }`}
        >
          <img
            src={getEmojiUrl(skins[skinTone || 0])}
            className="h-full w-full"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2">
        {skins.map((skin, idx) => (
          <button
            key={`skin-selector-${skin}`}
            className={`h-6 w-6 p-1 hover:bg-gray-100 ${
              idx === skinTone && 'bg-gray-100'
            }`}
            onClick={() => handleSkinToneSelection(idx)}
          >
            <EmojiElement id={skin} className="h-full w-full" alt="" />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
