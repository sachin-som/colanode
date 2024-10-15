import { ServerNodeSyncData } from '@/types/sync';

export type ServerNodesSyncMessageInput = {
  type: 'server_nodes_sync';
  nodes: ServerNodeSyncData[];
};

declare module '@/operations/messages' {
  interface MessageMap {
    server_nodes_sync: ServerNodesSyncMessageInput;
  }
}
