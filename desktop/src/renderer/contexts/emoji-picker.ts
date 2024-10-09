import { Emoji } from '@/lib/emojis';
import { createContext, useContext } from 'react';

interface EmojiPickerContextProps {
  skinTone: number;
  onPick: (emoji: Emoji) => void;
}

export const EmojiPickerContext = createContext<EmojiPickerContextProps>(
  {} as EmojiPickerContextProps,
);

export const useEmojiPicker = () => useContext(EmojiPickerContext);
