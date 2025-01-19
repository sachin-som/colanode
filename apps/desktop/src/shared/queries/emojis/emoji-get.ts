import { Emoji } from '@/shared/types/emojis';

export type EmojiGetQueryInput = {
  type: 'emoji_get';
  id: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    emoji_get: {
      input: EmojiGetQueryInput;
      output: Emoji;
    };
  }
}
