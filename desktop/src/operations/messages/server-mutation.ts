import { ServerChange } from '@/types/sync';

export type ServerMutationMessageInput = {
  type: 'server_mutation';
  accountId: string;
  change: ServerChange;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_mutation: ServerMutationMessageInput;
  }
}
