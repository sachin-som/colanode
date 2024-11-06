import { BreadcrumbNode } from '@/types/workspaces';

export type BreadcrumbListQueryInput = {
  type: 'breadcrumb_list';
  nodeId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    breadcrumb_list: {
      input: BreadcrumbListQueryInput;
      output: BreadcrumbNode[];
    };
  }
}
