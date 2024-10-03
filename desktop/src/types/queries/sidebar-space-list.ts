import { SidebarSpaceNode } from '@/types/workspaces';

export type SidebarSpaceListQueryInput = {
  type: 'sidebar_space_list';
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    sidebar_space_list: {
      input: SidebarSpaceListQueryInput;
      output: SidebarSpaceNode[];
    };
  }
}
