import { Server } from '@/types/servers';

export type ServerListQueryInput = {
  type: 'server_list';
};

declare module '@/types/queries' {
  interface QueryMap {
    server_list: {
      input: ServerListQueryInput;
      output: Server[];
    };
  }
}
