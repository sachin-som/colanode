type EventLoopStatus = 'idle' | 'scheduled' | 'processing';

export class EventLoop {
  private readonly interval: number;
  private readonly debounce: number;
  private readonly callback: () => void;

  private timeout: NodeJS.Timeout | null;
  private status: EventLoopStatus = 'idle';
  private triggered: boolean = false;

  constructor(interval: number, debounce: number, callback: () => void) {
    this.interval = interval;
    this.debounce = debounce;

    this.timeout = null;
    this.callback = callback;
  }

  public start(): void {
    if (this.status !== 'idle') {
      return;
    }

    this.status = 'scheduled';
    this.timeout = setTimeout(() => {
      this.execute();
    }, this.debounce);
  }

  public stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.status = 'idle';
  }

  public trigger(): void {
    if (this.status === 'processing') {
      this.triggered = true;
      return;
    }

    this.stop();
    this.start();
  }

  private execute(): void {
    if (this.status !== 'scheduled') {
      return;
    }

    this.status = 'processing';

    this.callback();

    const timeout = this.triggered ? this.debounce : this.interval;
    this.timeout = setTimeout(() => {
      this.execute();
    }, timeout);

    this.status = 'scheduled';
    this.triggered = false;
  }
}
