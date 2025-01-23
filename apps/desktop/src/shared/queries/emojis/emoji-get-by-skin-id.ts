import { Emoji } from '@/shared/types/emojis';

export type EmojiGetBySkinIdQueryInput = {
  type: 'emoji_get_by_skin_id';
  id: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    emoji_get_by_skin_id: {
      input: EmojiGetBySkinIdQueryInput;
      output: Emoji;
    };
  }
}
