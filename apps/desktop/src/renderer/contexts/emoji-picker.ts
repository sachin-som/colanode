import { EmojiData, Emoji } from '@/shared/types/emojis';
import { createContext, useContext } from 'react';

interface EmojiPickerContextProps {
  data: EmojiData;
  skinTone: number;
  onPick: (emoji: Emoji) => void;
}

export const EmojiPickerContext = createContext<EmojiPickerContextProps>(
  {} as EmojiPickerContextProps
);

export const useEmojiPicker = () => useContext(EmojiPickerContext);
