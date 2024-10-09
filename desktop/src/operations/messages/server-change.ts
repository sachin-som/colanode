import { ServerChange } from '@/types/sync';

export type ServerChangeMessageInput = {
  type: 'server_change';
  change: ServerChange;
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_change: ServerChangeMessageInput;
  }
}
