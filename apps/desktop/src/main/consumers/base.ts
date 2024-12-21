import { Kysely } from 'kysely';
import { Message } from '@colanode/core';

import { socketService } from '@/main/services/socket-service';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';

export type ConsumerStatus = 'idle' | 'fetching' | 'syncing';

export abstract class BaseConsumer {
  protected status: ConsumerStatus = 'idle';
  protected userId: string;
  protected accountId: string;
  protected workspaceDatabase: Kysely<WorkspaceDatabaseSchema>;

  private cursorValue: bigint = 0n;

  constructor(
    userId: string,
    accountId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    this.userId = userId;
    this.accountId = accountId;
    this.workspaceDatabase = workspaceDatabase;
  }

  protected abstract get cursorKey(): string;

  protected get cursor() {
    return this.cursorValue;
  }

  protected async initCursor() {
    const cursor = await this.workspaceDatabase
      .selectFrom('cursors')
      .select('value')
      .where('key', '=', this.cursorKey)
      .executeTakeFirst();

    this.cursorValue = cursor?.value ?? 0n;
  }

  protected async setCursor(cursor: bigint) {
    this.cursorValue = cursor;
    await this.workspaceDatabase
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

  protected sendMessage(message: Message) {
    return socketService.sendMessage(this.accountId, message);
  }
}
