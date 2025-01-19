import { ColumnType, Insertable, Selectable, Updateable } from 'kysely';

interface CategoriesTable {
  id: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  count: ColumnType<number, never, never>;
  display_order: ColumnType<number, never, never>;
}

export type SelectCategory = Selectable<CategoriesTable>;
export type CreateCategory = Insertable<CategoriesTable>;
export type UpdateCategory = Updateable<CategoriesTable>;

interface IconsTable {
  id: ColumnType<string, never, never>;
  category_id: ColumnType<string, never, never>;
  code: ColumnType<string, never, never>;
  name: ColumnType<string, never, never>;
  tags: ColumnType<string, never, never>;
}

export type SelectIcon = Selectable<IconsTable>;
export type CreateIcon = Insertable<IconsTable>;
export type UpdateIcon = Updateable<IconsTable>;

interface IconSvgsTable {
  id: ColumnType<string, never, never>;
  svg: ColumnType<Buffer, never, never>;
}

export type SelectIconSvg = Selectable<IconSvgsTable>;
export type CreateIconSvg = Insertable<IconSvgsTable>;
export type UpdateIconSvg = Updateable<IconSvgsTable>;

interface IconSearchTable {
  id: ColumnType<string, never, never>;
  text: ColumnType<string, never, never>;
}

export type SelectIconSearch = Selectable<IconSearchTable>;
export type CreateIconSearch = Insertable<IconSearchTable>;
export type UpdateIconSearch = Updateable<IconSearchTable>;

export interface IconDatabaseSchema {
  icons: IconsTable;
  categories: CategoriesTable;
  icon_search: IconSearchTable;
  icon_svgs: IconSvgsTable;
}
