import { EmojiCategory } from '@/shared/types/emojis';

export type EmojiCategoryListQueryInput = {
  type: 'emoji_category_list';
};

declare module '@/shared/queries' {
  interface QueryMap {
    emoji_category_list: {
      input: EmojiCategoryListQueryInput;
      output: EmojiCategory[];
    };
  }
}
