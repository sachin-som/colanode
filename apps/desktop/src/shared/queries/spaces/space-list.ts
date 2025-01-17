import { SpaceEntry } from '@colanode/core';

export type SpaceListQueryInput = {
  type: 'space_list';
  page: number;
  count: number;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    space_list: {
      input: SpaceListQueryInput;
      output: SpaceEntry[];
    };
  }
}
