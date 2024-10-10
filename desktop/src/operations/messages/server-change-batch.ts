import { ServerChange } from '@/types/sync';

export type ServerChangeBatchMessageInput = {
  type: 'server_change_batch';
  changes: ServerChange[];
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_change_batch: ServerChangeBatchMessageInput;
  }
}
