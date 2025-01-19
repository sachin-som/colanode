import { Icon } from '@/shared/types/icons';

export type IconSearchQueryInput = {
  type: 'icon_search';
  query: string;
  count: number;
};

declare module '@/shared/queries' {
  interface QueryMap {
    icon_search: {
      input: IconSearchQueryInput;
      output: Icon[];
    };
  }
}
