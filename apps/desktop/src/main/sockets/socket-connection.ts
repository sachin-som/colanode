import { WebSocket } from 'ws';
import { BackoffCalculator } from '@/lib/backoff-calculator';
import { MessageContext, MessageInput } from '@/operations/messages';
import { mediator } from '@/main/mediator';
import { SelectAccount, SelectServer } from '@/main/data/app/schema';
import { ServerAttributes } from '@/types/servers';

const buildSynapseUrl = (server: SelectServer, deviceId: string) => {
  const attributes = JSON.parse(server.attributes) as ServerAttributes;
  const protocol = attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};

export class SocketConnection {
  private readonly server: SelectServer;
  private readonly account: SelectAccount;
  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  constructor(server: SelectServer, account: SelectAccount) {
    this.server = server;
    this.account = account;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;
  }

  public init(): void {
    if (this.isConnected()) {
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    this.socket = new WebSocket(
      buildSynapseUrl(this.server, this.account.device_id),
      {
        headers: {
          authorization: this.account.token,
        },
      }
    );

    this.socket.onmessage = async (event) => {
      let data: string;

      if (typeof event.data === 'string') {
        data = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        data = new TextDecoder().decode(event.data);
      } else {
        console.error('Unsupported message data type:', typeof event.data);
        return;
      }

      const context: MessageContext = {
        accountId: this.account.id,
        deviceId: this.account.device_id,
      };
      const message: MessageInput = JSON.parse(data);
      await mediator.executeMessage(context, message);
    };

    this.socket.onopen = () => {
      this.backoffCalculator.reset();
    };

    this.socket.onerror = () => {
      this.backoffCalculator.increaseError();
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public sendMessage(message: MessageInput): void {
    if (this.socket) {
      this.socket.send(JSON.stringify(message));
    }
  }

  public close(): void {
    if (this.socket) {
      this.socket.close();
    }
  }

  public checkConnection(): void {
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
}
