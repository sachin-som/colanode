import { ServerChange } from '@/types/sync';

export type ServerChangeBatchMessageInput = {
  type: 'server_change_batch';
  changes: ServerChange[];
};
