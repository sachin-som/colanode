import { ConnectedUser } from '@/types/users';
import { Event } from '@/types/events';

export type ConsumerStatus = 'idle' | 'pending' | 'fetching';

export abstract class BaseConsumer {
  protected status: ConsumerStatus = 'idle';
  protected user: ConnectedUser;
  protected cursor: bigint | null = null;

  constructor(user: ConnectedUser) {
    this.user = user;
  }

  public abstract processEvent(event: Event): void;
}
