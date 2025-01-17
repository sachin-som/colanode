import { Message, createDebugger } from '@colanode/core';
import { WebSocket } from 'ws';
import ms from 'ms';

import { EventEmitter } from 'events';

import { BackoffCalculator } from '@/shared/lib/backoff-calculator';
import { AccountService } from '@/main/services/accounts/account-service';
import { EventLoop } from '@/shared/lib/event-loop';

export class AccountConnection extends EventEmitter {
  private readonly debug = createDebugger('service:account-connection');
  private readonly account: AccountService;
  private readonly eventLoop: EventLoop;

  private socket: WebSocket | null;
  private backoffCalculator: BackoffCalculator;
  private closingCount: number;

  constructor(accountService: AccountService) {
    super();

    this.account = accountService;
    this.socket = null;
    this.backoffCalculator = new BackoffCalculator();
    this.closingCount = 0;

    this.eventLoop = new EventLoop(ms('1 minute'), ms('1 second'), () => {
      this.checkConnection();
    });

    this.account.server.on('availability_change', () => {
      this.eventLoop.trigger();
    });
  }

  public init(): void {
    this.eventLoop.start();

    if (!this.account.server.isAvailable()) {
      return;
    }

    this.debug(`Initializing socket connection for account ${this.account.id}`);

    if (this.socket && this.isConnected()) {
      this.socket.ping();
      return;
    }

    if (!this.backoffCalculator.canRetry()) {
      return;
    }

    this.socket = new WebSocket(this.account.server.synapseUrl, {
      headers: {
        authorization: this.account.token,
      },
    });

    this.socket.onmessage = async (event) => {
      const data: string = event.data.toString();
      const message: Message = JSON.parse(data);

      this.debug(
        `Received message of type ${message.type} for account ${this.account.id}`
      );

      this.emit('message', message);
    };

    this.socket.onopen = () => {
      this.debug(`Socket connection for account ${this.account.id} opened`);

      this.backoffCalculator.reset();
      this.emit('open');
    };

    this.socket.onerror = () => {
      this.debug(`Socket connection for account ${this.account.id} errored`);
      this.backoffCalculator.increaseError();
      this.emit('close');
    };

    this.socket.onclose = () => {
      this.debug(`Socket connection for account ${this.account.id} closed`);
      this.backoffCalculator.increaseError();
      this.emit('close');
    };
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public send(message: Message): boolean {
    if (this.socket && this.isConnected()) {
      this.debug(
        `Sending message of type ${message.type} for account ${this.account.id}`
      );

      this.socket.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  public close(): void {
    if (this.socket) {
      this.debug(`Closing socket connection for account ${this.account.id}`);
      this.socket.close();
      this.socket = null;
    }

    this.removeAllListeners();
    this.eventLoop.stop();
  }

  private checkConnection(): void {
    this.debug(`Checking connection for account ${this.account.id}`);
    if (!this.account.server.isAvailable()) {
      return;
    }

    if (this.isConnected()) {
      this.socket?.ping();
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
