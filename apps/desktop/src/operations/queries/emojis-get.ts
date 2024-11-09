import { EmojiData } from '@/types/emojis';

export type EmojisGetQueryInput = {
  type: 'emojis_get';
};

declare module '@/operations/queries' {
  interface QueryMap {
    emojis_get: {
      input: EmojisGetQueryInput;
      output: EmojiData;
    };
  }
}
