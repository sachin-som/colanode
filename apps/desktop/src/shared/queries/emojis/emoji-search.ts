import { Emoji } from '@/shared/types/emojis';

export type EmojiSearchQueryInput = {
  type: 'emoji_search';
  query: string;
  count: number;
};

declare module '@/shared/queries' {
  interface QueryMap {
    emoji_search: {
      input: EmojiSearchQueryInput;
      output: Emoji[];
    };
  }
}
