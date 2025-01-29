export type FileBreadcrumbGetQueryInput = {
  type: 'file_breadcrumb_get';
  fileId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    file_breadcrumb_get: {
      input: FileBreadcrumbGetQueryInput;
      output: string[];
    };
  }
}
