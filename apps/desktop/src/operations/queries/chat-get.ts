import { ChatNode } from '@/types/chats';

export type ChatGetQueryInput = {
  type: 'chat_get';
  chatId: string;
  userId: string;
};

declare module '@/operations/queries' {
  interface QueryMap {
    chat_get: {
      input: ChatGetQueryInput;
      output: ChatNode | null;
    };
  }
}
