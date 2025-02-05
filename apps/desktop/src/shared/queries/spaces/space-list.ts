import { LocalSpaceNode } from '@/shared/types/nodes';

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
      output: LocalSpaceNode[];
    };
  }
}
