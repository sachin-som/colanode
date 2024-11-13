export type EmojiData = {
  categories: EmojiCategory[];
  emojis: Record<string, Emoji>;
};

export type Emoji = {
  id: string;
  code: string;
  name: string;
  tags: string[];
  emoticons: string[] | undefined;
  skins: EmojiSkin[];
};

export type EmojiCategory = {
  id: string;
  name: string;
  emojis: string[];
};

export type EmojiSkin = {
  id: string;
  unified: string;
};

export type EmojiPickerRowData = EmojiPickerLabelRow | EmojiPickerEmojiRow;

export type EmojiPickerLabelRow = {
  type: 'label';
  category: string;
};

export type EmojiPickerEmojiRow = {
  type: 'emoji';
  emojis: Emoji[];
};
