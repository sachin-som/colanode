import { Kysely } from 'kysely';
import {
  SynchronizerOutputMessage,
  SynchronizerInputMessage,
  SynchronizerInput,
  SynchronizerMap,
} from '@colanode/core';
import { sha256 } from 'js-sha256';

import { socketService } from '@/main/services/socket-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';

export type SynchronizerStatus = 'idle' | 'waiting' | 'processing';

export abstract class BaseSynchronizer<TInput extends SynchronizerInput> {
  public readonly id: string;
  public readonly userId: string;
  public readonly accountId: string;
  public readonly input: TInput;

  protected readonly database: Kysely<WorkspaceDatabaseSchema>;
  protected readonly debug = createDebugger('consumer');

  private status: SynchronizerStatus = 'idle';
  private cursor: bigint = 0n;

  constructor(
    userId: string,
    accountId: string,
    input: TInput,
    database: Kysely<WorkspaceDatabaseSchema>
  ) {
    this.id = this.generateId(userId, input);
    this.userId = userId;
    this.accountId = accountId;
    this.input = input;
    this.database = database;
  }

  protected abstract process(
    data: SynchronizerMap[TInput['type']]['data']
  ): Promise<void>;

  protected abstract get cursorKey(): string;

  public async init() {
    this.cursor = await this.fetchCursor();
    this.initConsumer();
  }

  public async ping() {
    this.initConsumer();
  }

  public async sync(message: SynchronizerOutputMessage<TInput>) {
    if (message.id !== this.id) {
      return;
    }

    if (this.status === 'processing') {
      return;
    }

    this.status = 'processing';
    let lastCursor: bigint | null = null;

    try {
      for (const item of message.items) {
        await this.process(item.data);
        lastCursor = BigInt(item.cursor);
      }
    } catch (error) {
      this.debug('Error consuming items', error);
    } finally {
      if (lastCursor !== null) {
        this.cursor = lastCursor;
        await this.saveCursor(lastCursor);
      }

      this.status = 'idle';
      this.initConsumer();
    }
  }

  private initConsumer() {
    if (this.status === 'processing') {
      return;
    }

    const message: SynchronizerInputMessage = {
      type: 'synchronizer_input',
      userId: this.userId,
      id: this.id,
      input: this.input,
      cursor: this.cursor.toString(),
    };

    const sent = socketService.sendMessage(this.accountId, message);
    if (!sent) {
      this.status = 'waiting';
    }
  }

  private async fetchCursor() {
    const cursor = await this.database
      .selectFrom('cursors')
      .select('value')
      .where('key', '=', this.cursorKey)
      .executeTakeFirst();

    return cursor?.value ?? 0n;
  }

  private async saveCursor(cursor: bigint) {
    await this.database
      .insertInto('cursors')
      .values({
        key: this.cursorKey,
        value: cursor,
        created_at: new Date().toISOString(),
      })
      .onConflict((eb) =>
        eb.column('key').doUpdateSet({
          value: cursor,
          updated_at: new Date().toISOString(),
        })
      )
      .execute();
  }

  public async delete() {
    await this.database
      .deleteFrom('cursors')
      .where('key', '=', this.cursorKey)
      .execute();
  }

  private generateId(userId: string, input: TInput) {
    const idObj = {
      userId,
      inputId: input,
    };

    return sha256(JSON.stringify(idObj));
  }
}
