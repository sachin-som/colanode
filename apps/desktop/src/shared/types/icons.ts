export type Icon = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  tags: string[];
};

export type IconCategory = {
  id: string;
  name: string;
  count: number;
  display_order: number;
};

export type IconPickerRowData = IconPickerLabelRow | IconPickerIconRow;

export type IconPickerLabelRow = {
  type: 'label';
  category: string;
};

export type IconPickerIconRow = {
  type: 'icon';
  category: string;
  page: number;
  count: number;
};
