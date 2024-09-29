import { WebSocket } from 'ws';
import { Account } from '@/types/accounts';
import { Server } from '@/types/servers';
import { buildSynapseUrl } from '@/lib/servers';

export type SocketMessage = {
  type: string;
  payload: any;
};

export class SocketManager {
  private readonly server: Server;
  private readonly account: Account;
  private socket: WebSocket | null;
  private closingCount: number;
  private listeners: Map<string, ((payload: any) => void)[]>;
  private lastInitAt: number;

  constructor(server: Server, account: Account) {
    this.server = server;
    this.account = account;
    this.socket = null;
    this.closingCount = 0;
    this.listeners = new Map();
    this.lastInitAt = 0;
  }

  public init(): void {
    if (this.isConnected()) {
      return;
    }

    // Prevent multiple init calls in a short period
    // init only once in 5 seconds
    if (Date.now() - this.lastInitAt < 5000) {
      return;
    }

    this.lastInitAt = Date.now();
    this.closingCount = 0;
    this.socket = new WebSocket(
      buildSynapseUrl(this.server, this.account.deviceId),
    );

    this.socket.onmessage = (event) => {
      let data: string;

      if (typeof event.data === 'string') {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        console.error('Unsupported message data type:', typeof event.data);
        return;
      }

      const message: SocketMessage = JSON.parse(data);
      const listeners = this.listeners.get(message.type) || [];
      for (const listener of listeners) {
        listener(message.payload);
      }
    };

    this.socket.onerror = (event) => {
      console.error('Socket error:', event);
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  public checkConnection(): void {
    if (this.account.status === 'logout') {
      if (this.isConnected()) {
        this.close();
      }

      return;
    }

    if (this.isConnected()) {
      return;
    }

    if (this.socket == null || this.socket.readyState === WebSocket.CLOSED) {
      this.init();
      return;
    }

    if (this.socket.readyState === WebSocket.CLOSING) {
      this.closingCount++;

      if (this.closingCount > 50) {
        this.socket.terminate();
        this.closingCount = 0;
      }
    }
  }

  public send(message: SocketMessage): void {
    if (this.isConnected()) {
      this.socket?.send(JSON.stringify(message));
    }
  }

  public on(type: string, listener: (payload: any) => void): void {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
}
