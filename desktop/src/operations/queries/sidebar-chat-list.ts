import { SidebarChatNode } from '@/types/workspaces';

export type SidebarChatListQueryInput = {
  type: 'sidebar_chat_list';
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    sidebar_chat_list: {
      input: SidebarChatListQueryInput;
      output: SidebarChatNode[];
    };
  }
}
