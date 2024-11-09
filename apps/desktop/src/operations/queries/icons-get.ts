import { IconData } from '@/types/icons';

export type IconsGetQueryInput = {
  type: 'icons_get';
};

declare module '@/operations/queries' {
  interface QueryMap {
    icons_get: {
      input: IconsGetQueryInput;
      output: IconData;
    };
  }
}
