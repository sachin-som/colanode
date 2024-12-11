import { sha256 } from 'js-sha256';

import { socketService } from '@/main/services/socket-service';
import { radarService } from '@/main/services/radar-service';
import { databaseService } from '@/main/data/database-service';
import { createDebugger } from '@/main/debugger';
import { JobHandler, JobInput, JobMap } from '@/main/jobs';
import { SyncServersJobHandler } from '@/main/jobs/sync-servers';
import { SyncAccountJobHandler } from '@/main/jobs/sync-account';
import { InitSyncConsumersJobHandler } from '@/main/jobs/init-sync-consumers';
import { RevertInvalidTransactionsJobHandler } from '@/main/jobs/revert-invalid-transactions';
import { SyncPendingTransactionsJobHandler } from '@/main/jobs/sync-pending-transactions';
import { SyncIncompleteTransactionsJobHandler } from '@/main/jobs/sync-incomplete-transactions';
import { SyncPendingInteractionsJobHandler } from '@/main/jobs/sync-pending-interactions';
import { SyncMissingNodesJobHandler } from '@/main/jobs/sync-missing-nodes';
import { SyncDeletedTokensJobHandler } from '@/main/jobs/sync-deleted-tokens';
import { ConnectSocketJobHandler } from '@/main/jobs/connect-socket';
import { eventBus } from '@/shared/lib/event-bus';
import { Event } from '@/shared/types/events';

type JobHandlerMap = {
  [K in keyof JobMap]: JobHandler<JobMap[K]['input']>;
};

export const jobHandlerMap: JobHandlerMap = {
  sync_servers: new SyncServersJobHandler(),
  sync_account: new SyncAccountJobHandler(),
  init_sync_consumers: new InitSyncConsumersJobHandler(),
  revert_invalid_transactions: new RevertInvalidTransactionsJobHandler(),
  sync_pending_transactions: new SyncPendingTransactionsJobHandler(),
  sync_incomplete_transactions: new SyncIncompleteTransactionsJobHandler(),
  sync_pending_interactions: new SyncPendingInteractionsJobHandler(),
  sync_missing_nodes: new SyncMissingNodesJobHandler(),
  sync_deleted_tokens: new SyncDeletedTokensJobHandler(),
  connect_socket: new ConnectSocketJobHandler(),
};

type JobState = {
  id: string;
  input: JobMap[keyof JobMap]['input'];
  running: boolean;
  triggered: boolean;
  handler: JobHandler<JobMap[keyof JobMap]['input']>;
  timeout: NodeJS.Timeout | null;
};

class Scheduler {
  private readonly debug = createDebugger('scheduler');
  private initPromise: Promise<void> | null = null;
  private initialized = false;

  private states: Map<string, JobState> = new Map();

  constructor() {
    eventBus.subscribe((event) => {
      this.handleEvent(event);
    });
  }

  public init() {
    if (!this.initPromise) {
      this.initPromise = this.executeInit();
    }

    return this.initPromise;
  }

  private async executeInit() {
    this.debug('Initializing scheduler');
    await databaseService.init();
    await this.scheduleJobs();
    radarService.init();

    this.initialized = true;
    this.debug('Scheduler initialized');
  }

  public schedule(input: JobInput) {
    const id = sha256(JSON.stringify(input));

    if (this.states.has(id)) {
      return;
    }

    const handler = jobHandlerMap[input.type] as JobHandler<
      JobMap[keyof JobMap]['input']
    >;

    if (!handler) {
      this.debug(`No handler found for job type: ${input.type}`);
      return;
    }

    const state: JobState = {
      id,
      input,
      running: false,
      triggered: false,
      handler,
      timeout: null,
    };

    state.timeout = setTimeout(() => {
      this.executeJob(state);
    }, 0);

    this.states.set(id, state);
  }

  public trigger(input: JobInput) {
    const id = sha256(JSON.stringify(input));
    const state = this.states.get(id);
    if (!state) {
      return;
    }

    if (state.running) {
      state.triggered = true;
      return;
    }

    if (state.timeout) {
      clearTimeout(state.timeout);
    }

    state.timeout = setTimeout(() => {
      this.executeJob(state);
    }, state.handler.triggerDebounce);
  }

  private async executeJob(state: JobState) {
    if (state.running) {
      return;
    }

    state.running = true;
    state.triggered = false;

    if (state.timeout) {
      clearTimeout(state.timeout);
    }

    try {
      await state.handler.handleJob(state.input);
    } catch (error) {
      this.debug(error, `Error executing job: ${state.input.type}`);
    } finally {
      state.running = false;

      if (state.timeout === null && state.handler.interval > 0) {
        state.timeout = setTimeout(() => {
          this.executeJob(state);
        }, state.handler.interval);
      }
    }
  }

  private async scheduleJobs() {
    this.schedule({ type: 'sync_servers' });
    this.schedule({ type: 'sync_deleted_tokens' });
  }

  private async scheduleServerAccountsJobs(domain: string) {
    const accounts = await databaseService.appDatabase
      .selectFrom('accounts')
      .selectAll()
      .where('server', '=', domain)
      .execute();

    for (const account of accounts) {
      this.scheduleAccountJobs(account.id);
    }
  }

  private scheduleAccountJobs(accountId: string) {
    this.schedule({ type: 'sync_account', accountId });
    this.schedule({ type: 'connect_socket', accountId });
  }

  private deleteAccountJobs(accountId: string) {
    const jobIds = Array.from(this.states.keys());

    for (const jobId of jobIds) {
      const state = this.states.get(jobId);
      if (!state) {
        continue;
      }

      if (
        state.input.type === 'sync_account' &&
        state.input.accountId === accountId
      ) {
        this.states.delete(jobId);
      } else if (
        state.input.type === 'connect_socket' &&
        state.input.accountId === accountId
      ) {
        this.states.delete(jobId);
      }
    }
  }

  private async scheduleAccountWorkspacesJobs(accountId: string) {
    const workspaces = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('account_id', '=', accountId)
      .execute();

    for (const workspace of workspaces) {
      this.scheduleWorkspaceJobs(accountId, workspace.user_id);
    }
  }

  private scheduleWorkspaceJobs(accountId: string, userId: string) {
    if (!socketService.isConnected(accountId)) {
      return;
    }

    this.schedule({
      type: 'sync_pending_transactions',
      userId,
    });

    this.schedule({
      type: 'sync_incomplete_transactions',
      userId,
    });

    this.schedule({
      type: 'sync_pending_interactions',
      userId,
    });

    this.schedule({
      type: 'sync_missing_nodes',
      userId,
    });

    this.schedule({
      type: 'revert_invalid_transactions',
      userId,
    });

    this.schedule({
      type: 'init_sync_consumers',
      userId,
      accountId,
    });
  }

  private deleteWorkspaceJobs(userId: string) {
    const jobIds = Array.from(this.states.keys());

    for (const jobId of jobIds) {
      const state = this.states.get(jobId);
      if (!state) {
        continue;
      }

      if (
        state.input.type === 'init_sync_consumers' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }

      if (
        state.input.type === 'sync_pending_transactions' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }

      if (
        state.input.type === 'sync_incomplete_transactions' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }

      if (
        state.input.type === 'sync_pending_interactions' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }

      if (
        state.input.type === 'sync_missing_nodes' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }

      if (
        state.input.type === 'revert_invalid_transactions' &&
        state.input.userId === userId
      ) {
        this.states.delete(jobId);
      }
    }
  }

  private handleEvent(event: Event) {
    if (!this.initialized) {
      return;
    }

    if (event.type === 'server_availability_changed' && event.isAvailable) {
      this.scheduleServerAccountsJobs(event.server.domain);
    } else if (event.type === 'server_created') {
      this.scheduleServerAccountsJobs(event.server.domain);
    } else if (event.type === 'account_created') {
      this.scheduleAccountJobs(event.account.id);
    } else if (event.type === 'account_deleted') {
      this.trigger({
        type: 'sync_deleted_tokens',
      });
      this.deleteAccountJobs(event.account.id);
    } else if (event.type === 'workspace_created') {
      this.scheduleWorkspaceJobs(
        event.workspace.accountId,
        event.workspace.userId
      );
    } else if (event.type === 'workspace_deleted') {
      this.deleteWorkspaceJobs(event.workspace.userId);
    } else if (event.type === 'socket_connection_opened') {
      this.scheduleAccountWorkspacesJobs(event.accountId);
    } else if (event.type === 'transaction_created') {
      this.trigger({
        type: 'sync_pending_transactions',
        userId: event.userId,
      });
    } else if (event.type === 'transaction_incomplete') {
      this.trigger({
        type: 'sync_incomplete_transactions',
        userId: event.userId,
      });
    } else if (event.type === 'interaction_event_created') {
      this.trigger({
        type: 'sync_pending_interactions',
        userId: event.userId,
      });
    }
  }
}

export const scheduler = new Scheduler();
