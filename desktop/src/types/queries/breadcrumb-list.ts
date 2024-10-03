import { BreadcrumbNode } from '@/types/workspaces';

export type BreadcrumbListQueryInput = {
  type: 'breadcrumb_list';
  nodeId: string;
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    breadcrumb_list: {
      input: BreadcrumbListQueryInput;
      output: BreadcrumbNode[];
    };
  }
}
