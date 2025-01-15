import {
  generateId,
  IdType,
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalUpdateTransaction,
  EntryAttributes,
  SyncCreateEntryTransactionData,
  SyncDeleteEntryTransactionData,
  SyncEntryInteractionData,
  SyncEntryTransactionData,
  SyncUpdateEntryTransactionData,
  extractEntryText,
  canDeleteEntry,
  canUpdateEntry,
  entryAttributesSchema,
  Entry,
  canCreateEntry,
  TransactionOperation,
  createDebugger,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';

import { databaseService } from '@/main/data/database-service';
import { SelectEntryTransaction } from '@/main/data/workspace/schema';
import {
  fetchEntry,
  fetchUser,
  mapEntry,
  mapEntryInteraction,
  mapEntryTransaction,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

const UPDATE_RETRIES_LIMIT = 20;

export type CreateEntryInput = {
  id: string;
  attributes: EntryAttributes;
  parentId: string | null;
};

export type UpdateEntryResult =
  | 'success'
  | 'not_found'
  | 'unauthorized'
  | 'failed'
  | 'invalid_attributes';

class EntryService {
  private readonly debug = createDebugger('desktop:service:entry');

  public async createEntry(userId: string, input: CreateEntryInput) {
    this.debug(`Creating ${Array.isArray(input) ? 'entries' : 'entry'}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const user = await fetchUser(workspaceDatabase, userId);
    if (!user) {
      throw new Error('User not found');
    }

    let root: Entry | null = null;

    if (input.parentId) {
      const parent = await fetchEntry(workspaceDatabase, input.parentId);

      if (parent) {
        if (parent.id === parent.root_id) {
          root = mapEntry(parent);
        } else {
          const rootRow = await fetchEntry(workspaceDatabase, parent.root_id);
          if (rootRow) {
            root = mapEntry(rootRow);
          }
        }
      }
    }

    if (
      !canCreateEntry(
        {
          user: {
            userId,
            role: user.role,
          },
          root: root,
        },
        input.attributes
      )
    ) {
      throw new Error('Insufficient permissions');
    }

    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(
      entryAttributesSchema,
      input.attributes
    );

    const createdAt = new Date().toISOString();
    const transactionId = generateId(IdType.Transaction);
    const text = extractEntryText(input.id, input.attributes);

    const { createdEntry, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdEntry = await trx
          .insertInto('entries')
          .returningAll()
          .values({
            id: input.id,
            root_id: root?.id ?? input.id,
            attributes: JSON.stringify(input.attributes),
            created_at: createdAt,
            created_by: userId,
            transaction_id: transactionId,
          })
          .executeTakeFirst();

        if (!createdEntry) {
          throw new Error('Failed to create entry');
        }

        const createdTransaction = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: transactionId,
            entry_id: input.id,
            root_id: root?.id ?? input.id,
            operation: TransactionOperation.Create,
            data: update,
            created_at: createdAt,
            created_by: userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'apply_create_transaction',
            data: JSON.stringify(mapEntryTransaction(createdTransaction)),
            created_at: createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({ id: input.id, name: text.name, text: text.text })
            .execute();
        }

        return {
          createdEntry,
          createdMutation,
        };
      });

    if (!createdEntry) {
      throw new Error('Failed to create entry');
    }

    this.debug(
      `Created entry ${createdEntry.id} with type ${createdEntry.type}`
    );

    eventBus.publish({
      type: 'entry_created',
      userId,
      entry: mapEntry(createdEntry),
    });

    if (!createdMutation) {
      throw new Error('Failed to create mutation');
    }

    this.debug(`Created mutation ${createdMutation.id}`);

    eventBus.publish({
      type: 'mutation_created',
      userId,
    });
  }

  public async updateEntry<T extends EntryAttributes>(
    entryId: string,
    userId: string,
    updater: (attributes: T) => T
  ): Promise<UpdateEntryResult> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateEntry(entryId, userId, updater);
      if (result) {
        return result;
      }
    }

    return 'failed';
  }

  private async tryUpdateEntry<T extends EntryAttributes>(
    entryId: string,
    userId: string,
    updater: (attributes: T) => T
  ): Promise<UpdateEntryResult | null> {
    this.debug(`Updating entry ${entryId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const entryRow = await fetchEntry(workspaceDatabase, entryId);
    if (!entryRow) {
      return 'not_found';
    }

    const user = await fetchUser(workspaceDatabase, userId);
    if (!user) {
      return 'not_found';
    }

    const root = await fetchEntry(workspaceDatabase, entryRow.root_id);
    if (!root) {
      return 'not_found';
    }

    const entry = mapEntry(entryRow);
    const transactionId = generateId(IdType.Transaction);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(entry.attributes as T);

    const ydoc = new YDoc();
    const previousTransactions = await workspaceDatabase
      .selectFrom('entry_transactions')
      .where('entry_id', '=', entryId)
      .selectAll()
      .execute();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        return 'not_found';
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    const update = ydoc.updateAttributes(
      entryAttributesSchema,
      updatedAttributes
    );

    if (
      !canUpdateEntry(
        {
          user: {
            userId,
            role: user.role,
          },
          root: mapEntry(root),
          entry: entry,
        },
        updatedAttributes
      )
    ) {
      return 'unauthorized';
    }

    const text = extractEntryText(entryId, updatedAttributes);

    const { updatedEntry, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: updatedAt,
            updated_by: userId,
            transaction_id: transactionId,
          })
          .where('id', '=', entryId)
          .where('transaction_id', '=', entry.transactionId)
          .executeTakeFirst();

        if (!updatedEntry) {
          return { updatedEntry: undefined };
        }

        const createdTransaction = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: transactionId,
            entry_id: entryId,
            root_id: entry.rootId,
            operation: TransactionOperation.Update,
            data: update,
            created_at: updatedAt,
            created_by: userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'apply_update_transaction',
            data: JSON.stringify(mapEntryTransaction(createdTransaction)),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        if (text !== undefined) {
          await trx.deleteFrom('texts').where('id', '=', entryId).execute();
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({ id: entryId, name: text.name, text: text.text })
            .execute();
        }

        return {
          updatedEntry,
          createdMutation,
        };
      });

    if (updatedEntry) {
      this.debug(
        `Updated entry ${updatedEntry.id} with type ${updatedEntry.type}`
      );

      eventBus.publish({
        type: 'entry_updated',
        userId,
        entry: mapEntry(updatedEntry),
      });
    } else {
      this.debug(`Failed to update entry ${entryId}`);
    }

    if (createdMutation) {
      this.debug(`Created mutation ${createdMutation.id} for entry ${entryId}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    } else {
      this.debug(`Failed to create mutation for entry ${entryId}`);
    }

    if (updatedEntry) {
      return 'success';
    }

    return null;
  }

  public async deleteEntry(entryId: string, userId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const user = await fetchUser(workspaceDatabase, userId);
    if (!user) {
      throw new Error('User not found');
    }

    const entry = await fetchEntry(workspaceDatabase, entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const root = await fetchEntry(workspaceDatabase, entry.root_id);
    if (!root) {
      throw new Error('Root not found');
    }

    if (
      !canDeleteEntry({
        user: {
          userId,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
      })
    ) {
      throw new Error('Insufficient permissions');
    }

    const { deletedEntry, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const deletedEntry = await trx
          .deleteFrom('entries')
          .returningAll()
          .where('id', '=', entryId)
          .executeTakeFirst();

        if (!deletedEntry) {
          return { deletedEntry: undefined };
        }

        await trx.deleteFrom('texts').where('id', '=', entryId).execute();

        const createdTransaction = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: generateId(IdType.Transaction),
            entry_id: entryId,
            root_id: root.root_id,
            operation: TransactionOperation.Delete,
            data: null,
            created_at: new Date().toISOString(),
            created_by: userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'apply_delete_transaction',
            data: JSON.stringify(mapEntryTransaction(createdTransaction)),
            created_at: new Date().toISOString(),
            retries: 0,
          })
          .executeTakeFirst();

        return { deletedEntry, createdMutation };
      });

    if (deletedEntry) {
      this.debug(
        `Deleted entry ${deletedEntry.id} with type ${deletedEntry.type}`
      );

      eventBus.publish({
        type: 'entry_deleted',
        userId,
        entry: mapEntry(deletedEntry),
      });
    } else {
      this.debug(`Failed to delete entry ${entryId}`);
    }

    if (createdMutation) {
      this.debug(`Created mutation ${createdMutation.id} for entry ${entryId}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    } else {
      this.debug(`Failed to create mutation for entry ${entryId}`);
    }
  }

  public async applyServerTransaction(
    userId: string,
    transaction: SyncEntryTransactionData
  ) {
    if (transaction.operation === TransactionOperation.Create) {
      await this.applyServerCreateTransaction(userId, transaction);
    } else if (transaction.operation === TransactionOperation.Update) {
      await this.applyServerUpdateTransaction(userId, transaction);
    } else if (transaction.operation === TransactionOperation.Delete) {
      await this.applyServerDeleteTransaction(userId, transaction);
    }
  }

  private async applyServerCreateTransaction(
    userId: string,
    transaction: SyncCreateEntryTransactionData
  ) {
    this.debug(
      `Applying server create transaction ${transaction.id} for entry ${transaction.entryId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const version = BigInt(transaction.version);
    const existingTransaction = await workspaceDatabase
      .selectFrom('entry_transactions')
      .select(['id', 'version', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.version === version &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        this.debug(
          `Server create transaction ${transaction.id} for entry ${transaction.entryId} is already synced`
        );
        return;
      }

      await workspaceDatabase
        .updateTable('entry_transactions')
        .set({
          version,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      this.debug(
        `Server create transaction ${transaction.id} for entry ${transaction.entryId} has been synced`
      );
      return;
    }

    const ydoc = new YDoc();
    ydoc.applyUpdate(transaction.data);
    const attributes = ydoc.getAttributes<EntryAttributes>();
    const text = extractEntryText(transaction.entryId, attributes);

    const { createdEntry } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdEntry = await trx
          .insertInto('entries')
          .returningAll()
          .values({
            id: transaction.entryId,
            root_id: transaction.rootId,
            attributes: JSON.stringify(attributes),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .executeTakeFirst();

        await trx
          .insertInto('entry_transactions')
          .values({
            id: transaction.id,
            entry_id: transaction.entryId,
            root_id: transaction.rootId,
            operation: TransactionOperation.Create,
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            version,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        if (text) {
          await trx
            .insertInto('texts')
            .values({
              id: transaction.entryId,
              name: text.name,
              text: text.text,
            })
            .execute();
        }

        return { createdEntry };
      });

    if (!createdEntry) {
      this.debug(
        `Server create transaction ${transaction.id} for entry ${transaction.entryId} is incomplete`
      );
      return;
    }

    this.debug(
      `Created entry ${createdEntry.id} with type ${createdEntry.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'entry_created',
      userId,
      entry: mapEntry(createdEntry),
    });
  }

  private async applyServerUpdateTransaction(
    userId: string,
    transaction: SyncUpdateEntryTransactionData
  ) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryApplyServerUpdateTransaction(
        userId,
        transaction
      );

      if (result) {
        return;
      }
    }
  }

  private async tryApplyServerUpdateTransaction(
    userId: string,
    transaction: SyncUpdateEntryTransactionData
  ): Promise<boolean> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const version = BigInt(transaction.version);
    const existingTransaction = await workspaceDatabase
      .selectFrom('entry_transactions')
      .select(['id', 'version', 'server_created_at'])
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (existingTransaction) {
      if (
        existingTransaction.version === version &&
        existingTransaction.server_created_at === transaction.serverCreatedAt
      ) {
        this.debug(
          `Server update transaction ${transaction.id} for entry ${transaction.entryId} is already synced`
        );
        return true;
      }

      await workspaceDatabase
        .updateTable('entry_transactions')
        .set({
          version,
          server_created_at: transaction.serverCreatedAt,
        })
        .where('id', '=', transaction.id)
        .execute();

      this.debug(
        `Server update transaction ${transaction.id} for entry ${transaction.entryId} has been synced`
      );
      return true;
    }

    const entry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', transaction.entryId)
      .executeTakeFirst();

    if (!entry) {
      return false;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('entry_id', '=', transaction.entryId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();

    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }
    }

    ydoc.applyUpdate(transaction.data);
    const attributes = ydoc.getAttributes<EntryAttributes>();
    const text = extractEntryText(transaction.entryId, attributes);

    const { updatedEntry } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: JSON.stringify(attributes),
            updated_at: transaction.createdAt,
            updated_by: transaction.createdBy,
            transaction_id: transaction.id,
          })
          .where('id', '=', transaction.entryId)
          .where('transaction_id', '=', entry.transaction_id)
          .executeTakeFirst();

        if (!updatedEntry) {
          return { updatedEntry: undefined };
        }

        await trx
          .insertInto('entry_transactions')
          .values({
            id: transaction.id,
            entry_id: transaction.entryId,
            root_id: transaction.rootId,
            operation: TransactionOperation.Update,
            data: decodeState(transaction.data),
            created_at: transaction.createdAt,
            created_by: transaction.createdBy,
            version,
            server_created_at: transaction.serverCreatedAt,
          })
          .execute();

        if (text !== undefined) {
          await trx
            .deleteFrom('texts')
            .where('id', '=', transaction.entryId)
            .execute();
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({
              id: transaction.entryId,
              name: text.name,
              text: text.text,
            })
            .execute();
        }

        return { updatedEntry };
      });

    if (!updatedEntry) {
      this.debug(
        `Server update transaction ${transaction.id} for entry ${transaction.entryId} is incomplete`
      );
      return false;
    }

    this.debug(
      `Updated entry ${updatedEntry.id} with type ${updatedEntry.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'entry_updated',
      userId,
      entry: mapEntry(updatedEntry),
    });

    return true;
  }

  private async applyServerDeleteTransaction(
    userId: string,
    transaction: SyncDeleteEntryTransactionData
  ) {
    this.debug(
      `Applying server delete transaction ${transaction.id} for entry ${transaction.entryId}`
    );

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const { deletedEntry } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const deletedEntry = await trx
          .deleteFrom('entries')
          .returningAll()
          .where('id', '=', transaction.entryId)
          .executeTakeFirst();

        await trx
          .deleteFrom('entry_transactions')
          .where('entry_id', '=', transaction.entryId)
          .execute();

        await trx
          .deleteFrom('entry_interactions')
          .where('entry_id', '=', transaction.entryId)
          .execute();

        await trx
          .deleteFrom('texts')
          .where('id', '=', transaction.entryId)
          .execute();

        return { deletedEntry };
      });

    this.debug(
      `Deleted entry ${transaction.entryId} with transaction ${transaction.id}`
    );

    if (!deletedEntry) {
      return;
    }

    eventBus.publish({
      type: 'entry_deleted',
      userId,
      entry: mapEntry(deletedEntry),
    });
  }

  public async revertCreateTransaction(
    userId: string,
    transaction: LocalCreateTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const entry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', transaction.entryId)
      .executeTakeFirst();

    if (!entry) {
      return;
    }

    const transactionRow = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return;
    }

    await workspaceDatabase.transaction().execute(async (tx) => {
      await tx
        .deleteFrom('entries')
        .where('id', '=', transaction.entryId)
        .execute();

      await tx
        .deleteFrom('entry_transactions')
        .where('id', '=', transaction.id)
        .execute();

      await tx
        .deleteFrom('entry_interactions')
        .where('entry_id', '=', transaction.entryId)
        .execute();

      await tx
        .deleteFrom('texts')
        .where('id', '=', transaction.entryId)
        .execute();
    });

    eventBus.publish({
      type: 'entry_deleted',
      userId,
      entry: mapEntry(entry),
    });
  }

  public async revertUpdateTransaction(
    userId: string,
    transaction: LocalUpdateTransaction
  ) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryRevertUpdateTransaction(userId, transaction);

      if (result) {
        return;
      }
    }
  }

  private async tryRevertUpdateTransaction(
    userId: string,
    transaction: LocalUpdateTransaction
  ): Promise<boolean> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const entry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', transaction.entryId)
      .executeTakeFirst();

    if (!entry) {
      // Make sure we don't have any data left behind
      await workspaceDatabase
        .deleteFrom('entry_transactions')
        .where('id', '=', transaction.id)
        .execute();

      await workspaceDatabase
        .deleteFrom('entry_interactions')
        .where('entry_id', '=', transaction.entryId)
        .execute();

      await workspaceDatabase
        .deleteFrom('texts')
        .where('id', '=', transaction.entryId)
        .execute();

      return true;
    }

    const transactionRow = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return true;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('entry_id', '=', transaction.entryId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();
    let lastTransaction: SelectEntryTransaction | undefined;
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.id === transaction.id) {
        continue;
      }

      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }

      lastTransaction = previousTransaction;
    }

    if (!lastTransaction) {
      return true;
    }

    const attributes = ydoc.getAttributes<EntryAttributes>();
    const text = extractEntryText(transaction.entryId, attributes);

    const updatedEntry = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: lastTransaction.created_at,
            updated_by: lastTransaction.created_by,
            transaction_id: lastTransaction.id,
          })
          .where('id', '=', transaction.entryId)
          .where('transaction_id', '=', entry.transaction_id)
          .executeTakeFirst();

        if (!updatedEntry) {
          return undefined;
        }

        if (text !== undefined) {
          await trx
            .deleteFrom('texts')
            .where('id', '=', transaction.entryId)
            .execute();
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({
              id: transaction.entryId,
              name: text.name,
              text: text.text,
            })
            .execute();
        }

        await trx
          .deleteFrom('entry_transactions')
          .where('id', '=', transaction.id)
          .execute();
      });

    if (updatedEntry) {
      eventBus.publish({
        type: 'entry_updated',
        userId,
        entry: mapEntry(updatedEntry),
      });

      return true;
    }

    return false;
  }

  public async revertDeleteTransaction(
    userId: string,
    transaction: LocalDeleteTransaction
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const transactionRow = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('id', '=', transaction.id)
      .executeTakeFirst();

    if (!transactionRow) {
      return;
    }

    const previousTransactions = await workspaceDatabase
      .selectFrom('entry_transactions')
      .selectAll()
      .where('entry_id', '=', transaction.entryId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();

    let lastTransaction: SelectEntryTransaction | undefined;
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.id === transaction.id) {
        continue;
      }

      if (previousTransaction.data) {
        ydoc.applyUpdate(previousTransaction.data);
      }

      lastTransaction = previousTransaction;
    }

    if (!lastTransaction) {
      return true;
    }

    const attributes = ydoc.getAttributes<EntryAttributes>();
    const text = extractEntryText(transaction.entryId, attributes);

    const createdEntry = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdEntry = await trx
          .insertInto('entries')
          .returningAll()
          .values({
            id: transaction.entryId,
            root_id: transaction.rootId,
            created_at: lastTransaction.created_at,
            created_by: lastTransaction.created_by,
            attributes: JSON.stringify(attributes),
            updated_at: lastTransaction.created_at,
            updated_by: lastTransaction.created_by,
            transaction_id: lastTransaction.id,
          })
          .onConflict((b) =>
            b
              .columns(['id'])
              .doUpdateSet({
                attributes: JSON.stringify(attributes),
                updated_at: lastTransaction.created_at,
                updated_by: lastTransaction.created_by,
                transaction_id: lastTransaction.id,
              })
              .where('transaction_id', '=', transaction.id)
          )
          .executeTakeFirst();

        if (!createdEntry) {
          return undefined;
        }

        await trx
          .deleteFrom('entry_transactions')
          .where('id', '=', transaction.id)
          .execute();

        if (text !== undefined) {
          await trx
            .deleteFrom('texts')
            .where('id', '=', transaction.entryId)
            .execute();
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({
              id: transaction.entryId,
              name: text.name,
              text: text.text,
            })
            .execute();
        }
      });

    if (createdEntry) {
      eventBus.publish({
        type: 'entry_created',
        userId,
        entry: mapEntry(createdEntry),
      });

      return true;
    }

    return false;
  }

  public async syncServerEntryInteraction(
    userId: string,
    entryInteraction: SyncEntryInteractionData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingEntryInteraction = await workspaceDatabase
      .selectFrom('entry_interactions')
      .selectAll()
      .where('entry_id', '=', entryInteraction.entryId)
      .executeTakeFirst();

    const version = BigInt(entryInteraction.version);
    if (existingEntryInteraction) {
      if (existingEntryInteraction.version === version) {
        this.debug(
          `Server entry interaction for entry ${entryInteraction.entryId} is already synced`
        );
        return;
      }
    }

    const createdEntryInteraction = await workspaceDatabase
      .insertInto('entry_interactions')
      .returningAll()
      .values({
        entry_id: entryInteraction.entryId,
        root_id: entryInteraction.rootId,
        collaborator_id: entryInteraction.collaboratorId,
        first_seen_at: entryInteraction.firstSeenAt,
        last_seen_at: entryInteraction.lastSeenAt,
        last_opened_at: entryInteraction.lastOpenedAt,
        first_opened_at: entryInteraction.firstOpenedAt,
        version,
      })
      .onConflict((b) =>
        b.columns(['entry_id', 'collaborator_id']).doUpdateSet({
          last_seen_at: entryInteraction.lastSeenAt,
          first_seen_at: entryInteraction.firstSeenAt,
          last_opened_at: entryInteraction.lastOpenedAt,
          first_opened_at: entryInteraction.firstOpenedAt,
          version,
        })
      )
      .executeTakeFirst();

    if (!createdEntryInteraction) {
      return;
    }

    eventBus.publish({
      type: 'entry_interaction_updated',
      userId,
      entryInteraction: mapEntryInteraction(createdEntryInteraction),
    });

    this.debug(
      `Server entry interaction for entry ${entryInteraction.entryId} has been synced`
    );
  }
}

export const entryService = new EntryService();
