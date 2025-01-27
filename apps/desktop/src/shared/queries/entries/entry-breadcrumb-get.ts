export type EntryBreadcrumbGetQueryInput = {
  type: 'entry_breadcrumb_get';
  entryId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    entry_breadcrumb_get: {
      input: EntryBreadcrumbGetQueryInput;
      output: string[];
    };
  }
}
