import { Kysely } from 'kysely';
import { ConsumeFilesMessage, FilesBatchMessage } from '@colanode/core';

import { fileService } from '@/main/services/file-service';
import { createDebugger } from '@/main/debugger';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';
import { BaseConsumer } from '@/main/consumers/base';

export class FilesConsumer extends BaseConsumer {
  private readonly debug = createDebugger('consumer:files');
  private readonly rootId: string;

  constructor(
    userId: string,
    accountId: string,
    rootId: string,
    workspaceDatabase: Kysely<WorkspaceDatabaseSchema>
  ) {
    super(userId, accountId, workspaceDatabase);
    this.rootId = rootId;
  }

  protected get cursorKey(): string {
    return `files:${this.rootId}`;
  }

  public async init() {
    await super.initCursor();
    this.requestFiles();
  }

  public async processFiles(message: FilesBatchMessage) {
    if (this.status === 'syncing') {
      this.debug(
        `Syncing of server files already in progress for user ${message.userId}, skipping`
      );
      return;
    }

    this.debug(`Syncing server files for user ${message.userId}`);

    this.status = 'syncing';
    let cursor: bigint | null = null;
    try {
      for (const file of message.files) {
        await fileService.syncServerFile(message.userId, file);
        cursor = BigInt(file.version);
      }
    } catch (error) {
      this.debug(
        error,
        `Error syncing server files for user ${message.userId}`
      );
    } finally {
      this.debug(
        `Syncing of server files completed for user ${message.userId}`
      );

      if (cursor) {
        await this.setCursor(cursor);
      }

      this.status = 'idle';
      this.requestFiles();
    }
  }

  private async requestFiles() {
    const message: ConsumeFilesMessage = {
      type: 'consume_files',
      userId: this.userId,
      rootId: this.rootId,
      cursor: this.cursor.toString(),
    };

    this.sendMessage(message);
  }
}
