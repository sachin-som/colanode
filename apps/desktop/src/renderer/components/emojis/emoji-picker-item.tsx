import { Emoji } from '@/types/emojis';
import { EmojiElement } from '@/renderer/components/emojis/emoji-element';
import { useEmojiPicker } from '@/renderer/contexts/emoji-picker';

interface EmojiPickerItemProps {
  emoji: Emoji;
}

export const EmojiPickerItem = ({ emoji }: EmojiPickerItemProps) => {
  const { skinTone, onPick: onEmojiClick } = useEmojiPicker();

  let id = emoji.skins[0].id;
  if (skinTone !== 0 && skinTone < emoji.skins.length) {
    id = emoji.skins[skinTone].id;
  }

  return (
    <button
      className="p-1 ring-gray-100 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:border-gray-100 focus:outline-none focus:ring"
      onClick={() => onEmojiClick(emoji)}
    >
      <EmojiElement className="h-5 w-5" id={id} />
    </button>
  );
};
