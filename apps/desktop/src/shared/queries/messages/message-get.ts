import { MessageNode } from '@/shared/types/messages';

export type MessageGetQueryInput = {
  type: 'message_get';
  messageId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    message_get: {
      input: MessageGetQueryInput;
      output: MessageNode | null;
    };
  }
}
