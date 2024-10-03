import { SidebarChatNode } from '@/types/workspaces';

export type SidebarChatListQueryInput = {
  type: 'sidebar_chat_list';
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    sidebar_chat_list: {
      input: SidebarChatListQueryInput;
      output: SidebarChatNode[];
    };
  }
}
