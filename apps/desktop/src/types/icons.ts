export type IconData = {
  categories: IconCategory[];
  icons: Record<string, Icon>;
};

export type Icon = {
  id: string;
  name: string;
  code: string;
  tags: string[];
};

export type IconCategory = {
  id: string;
  name: string;
  icons: string[];
};

export type IconPickerRowData = IconPickerLabelRow | IconPickerEmojiRow;

export type IconPickerLabelRow = {
  type: 'label';
  category: string;
};

export type IconPickerEmojiRow = {
  type: 'icon';
  icons: Icon[];
};
