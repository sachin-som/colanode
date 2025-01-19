import { IconCategory } from '@/shared/types/icons';

export type IconCategoryListQueryInput = {
  type: 'icon_category_list';
};

declare module '@/shared/queries' {
  interface QueryMap {
    icon_category_list: {
      input: IconCategoryListQueryInput;
      output: IconCategory[];
    };
  }
}
