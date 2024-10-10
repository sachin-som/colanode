import { ServerChangeMessageInput } from '@/messages/server-change';
import { ServerChangeResultMessageInput } from '@/messages/server-change-result';
import { ServerChangeBatchMessageInput } from '@/messages/server-change-batch';

export interface MessageMap {
  server_change: ServerChangeMessageInput;
  server_change_result: ServerChangeResultMessageInput;
  server_change_batch: ServerChangeBatchMessageInput;
}

export type MessageInput = MessageMap[keyof MessageMap];

export type MessageContext = {
  accountId: string;
  deviceId: string;
};
