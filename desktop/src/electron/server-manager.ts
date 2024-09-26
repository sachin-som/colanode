import { Server } from '@/types/servers';

export class ServerManager {
  public readonly server: Server;

  constructor(server: Server) {
    this.server = server;
  }
}
