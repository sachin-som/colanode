export type MessageBreadcrumbGetQueryInput = {
  type: 'message_breadcrumb_get';
  messageId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_breadcrumb_get: {
      input: MessageBreadcrumbGetQueryInput;
      output: string[];
    };
  }
}
