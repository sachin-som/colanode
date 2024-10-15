import { ServerNodeSyncData } from '@/types/sync';

export type ServerNodesSyncMessageInput = {
  type: 'server_nodes_sync';
  nodes: ServerNodeSyncData[];
};
