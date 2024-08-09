import { WebSocket } from 'ws';

class SocketConnections {
  private sockets: Map<string, WebSocket> = new Map();

  public addSocket(deviceId: string, ws: WebSocket) {
    this.sockets.set(deviceId, ws);
  }

  public removeSocket(deviceId: string) {
    this.sockets.delete(deviceId);
  }

  public getSocket(deviceId: string): WebSocket | undefined {
    return this.sockets.get(deviceId);
  }
}

export const sockets = new SocketConnections();
