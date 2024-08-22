import { WebSocket } from 'ws';
import { Account } from '@/types/accounts';

const SOCKET_URL = 'ws://localhost:3000';

export type SocketMessage = {
  type: string;
  payload: any;
};

export class SocketManager {
  private readonly account: Account;
  private socket: WebSocket | null;
  private closingCount: number;
  private listeners: Map<string, ((payload: any) => void)[]>;

  constructor(account: Account) {
    this.account = account;
    this.socket = null;
    this.closingCount = 0;
    this.listeners = new Map();
  }

  public init() {
    this.closingCount = 0;
    this.socket = new WebSocket(
      `${SOCKET_URL}/v1/synapse?device_id=${this.account.deviceId}`,
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

  public close() {
    if (this.socket) {
      this.socket.close();
    }
  }

  public checkConnection() {
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

  public send(message: SocketMessage) {
    if (this.isConnected()) {
      this.socket?.send(JSON.stringify(message));
    }
  }

  public on(type: string, listener: (payload: any) => void) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
}
