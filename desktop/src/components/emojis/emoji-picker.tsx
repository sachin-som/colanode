import React from 'react';
import { EmojiSkinToneSelector } from '@/components/emojis/emoji-skin-tone-selector';
import { Emoji } from '@/lib/emojis';
import { EmojiPickerContext } from '@/renderer/contexts/emoji-picker';
import { EmojiPickerBrowser } from '@/components/emojis/emoji-picker-browser';
import { EmojiPickerSearch } from '@/components/emojis/emoji-picker-search';

interface EmojiPickerProps {
  onEmojiClick: (emoji: Emoji) => void;
}

export const EmojiPicker = ({ onEmojiClick }: EmojiPickerProps) => {
  const [query, setQuery] = React.useState('');
  const [skinTone, setSkinTone] = React.useState(0);

  return (
    <EmojiPickerContext.Provider value={{ skinTone, onEmojiClick }}>
      <div className="flex flex-col gap-1 p-1">
        <div className="flex flex-row items-center gap-1">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md bg-gray-100 p-2 text-xs focus:outline-none"
          />
          <EmojiSkinToneSelector
            skinTone={skinTone}
            onSkinToneChange={setSkinTone}
          />
        </div>
        <div className="h-full min-h-[280px] w-full overflow-auto md:w-[350px]">
          {query.length > 2 ? (
            <EmojiPickerSearch query={query} />
          ) : (
            <EmojiPickerBrowser />
          )}
        </div>
      </div>
    </EmojiPickerContext.Provider>
  );
};
