import {
  generateId,
  IdType,
  LocalCreateTransaction,
  LocalDeleteTransaction,
  LocalUpdateTransaction,
  Entry,
  EntryAttributes,
  EntryMutationContext,
  registry,
  SyncCreateEntryTransactionData,
  SyncDeleteEntryTransactionData,
  SyncEntryInteractionData,
  SyncEntryTransactionData,
  SyncUpdateEntryTransactionData,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';

import { createDebugger } from '@/main/debugger';
import { SelectWorkspace } from '@/main/data/app/schema';
import { databaseService } from '@/main/data/database-service';
import {
  SelectMutation,
  SelectEntry,
  SelectEntryTransaction,
} from '@/main/data/workspace/schema';
import {
  fetchEntryAncestors,
  mapEntry,
  mapEntryInteraction,
  mapEntryTransaction,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';

const UPDATE_RETRIES_LIMIT = 20;

export type CreateEntryInput = {
  id: string;
  attributes: EntryAttributes;
};

export type UpdateEntryResult =
  | 'success'
  | 'not_found'
  | 'unauthorized'
  | 'failed'
  | 'invalid_attributes';

class EntryService {
  private readonly debug = createDebugger('service:entry');

  public async fetchEntry(
    entryId: string,
    userId: string
  ): Promise<Entry | null> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const entryRow = await workspaceDatabase
      .selectFrom('entries')
      .where('id', '=', entryId)
      .selectAll()
      .executeTakeFirst();

    if (!entryRow) {
      return null;
    }

    return mapEntry(entryRow);
  }

  public async createEntry(
    userId: string,
    input: CreateEntryInput | CreateEntryInput[]
  ) {
    this.debug(`Creating ${Array.isArray(input) ? 'entries' : 'entry'}`);
    const workspace = await this.fetchWorkspace(userId);

    const inputs = Array.isArray(input) ? input : [input];
    const createdEntries: SelectEntry[] = [];
    const createdMutations: SelectMutation[] = [];

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase.transaction().execute(async (transaction) => {
      for (const inputItem of inputs) {
        const model = registry.getModel(inputItem.attributes.type);
        if (!model.schema.safeParse(inputItem.attributes).success) {
          throw new Error('Invalid attributes');
        }

        let ancestors: Entry[] = [];
        if (inputItem.attributes.parentId) {
          const ancestorRows = await fetchEntryAncestors(
            transaction,
            inputItem.attributes.parentId
          );
          ancestors = ancestorRows.map(mapEntry);
        }

        const rootId = ancestors[0]?.id ?? inputItem.id;
        const context = new EntryMutationContext(
          workspace.account_id,
          workspace.workspace_id,
          userId,
          workspace.role,
          ancestors
        );

        if (!model.canCreate(context, inputItem.attributes)) {
          throw new Error('Insufficient permissions');
        }

        const ydoc = new YDoc();
        const update = ydoc.updateAttributes(
          model.schema,
          inputItem.attributes
        );

        const createdAt = new Date().toISOString();
        const transactionId = generateId(IdType.Transaction);
        const text = model.getText(inputItem.id, inputItem.attributes);

        const createdEntry = await transaction
          .insertInto('entries')
          .returningAll()
          .values({
            id: inputItem.id,
            root_id: rootId,
            attributes: JSON.stringify(inputItem.attributes),
            created_at: createdAt,
            created_by: context.userId,
            transaction_id: transactionId,
          })
          .executeTakeFirst();

        if (!createdEntry) {
          throw new Error('Failed to create entry');
        }

        createdEntries.push(createdEntry);

        const createdTransaction = await transaction
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: transactionId,
            entry_id: inputItem.id,
            root_id: rootId,
            operation: 'create',
            data: update,
            created_at: createdAt,
            created_by: context.userId,
            version: 0n,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const mutation = await transaction
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            node_id: inputItem.id,
            type: 'apply_create_transaction',
            data: JSON.stringify(mapEntryTransaction(createdTransaction)),
            created_at: createdAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!mutation) {
          throw new Error('Failed to create mutation');
        }

        createdMutations.push(mutation);

        if (text) {
          await transaction
            .insertInto('texts')
            .values({ id: inputItem.id, name: text.name, text: text.text })
            .execute();
        }
      }
    });

    for (const createdEntry of createdEntries) {
      this.debug(
        `Created entry ${createdEntry.id} with type ${createdEntry.type}`
      );

      eventBus.publish({
        type: 'entry_created',
        userId,
        entry: mapEntry(createdEntry),
      });
    }

    for (const createdMutation of createdMutations) {
      this.debug(`Created mutation ${createdMutation.id}`);

      eventBus.publish({
        type: 'mutation_created',
        userId,
      });
    }
  }

  public async updateEntry(
    entryId: string,
    userId: string,
    updater: (attributes: EntryAttributes) => EntryAttributes
  ): Promise<UpdateEntryResult> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateEntry(entryId, userId, updater);
      if (result) {
        return result;
      }
    }

    return 'failed';
  }

  private async tryUpdateEntry(
    entryId: string,
    userId: string,
    updater: (attributes: EntryAttributes) => EntryAttributes
  ): Promise<UpdateEntryResult | null> {
    this.debug(`Updating entry ${entryId}`);

    const workspace = await this.fetchWorkspace(userId);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchEntryAncestors(workspaceDatabase, entryId);
    const entryRow = ancestorRows.find((ancestor) => ancestor.id === entryId);
    if (!entryRow) {
      return 'not_found';
    }

    const ancestors = ancestorRows.map(mapEntry);
    const entry = mapEntry(entryRow);

    if (!entry) {
      return 'not_found';
    }

    const context = new EntryMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    const transactionId = generateId(IdType.Transaction);
    const updatedAt = new Date().toISOString();
    const updatedAttributes = updater(entry.attributes);

    const model = registry.getModel(entry.type);
    if (!model.schema.safeParse(updatedAttributes).success) {
      return 'invalid_attributes';
    }

    if (!model.canUpdate(context, entry, updatedAttributes)) {
      return 'unauthorized';
    }

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

    const update = ydoc.updateAttributes(model.schema, updatedAttributes);
    const text = model.getText(entryId, updatedAttributes);

    const { updatedEntry, createdMutation } = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: JSON.stringify(ydoc.getAttributes()),
            updated_at: updatedAt,
            updated_by: context.userId,
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
            operation: 'update',
            data: update,
            created_at: updatedAt,
            created_by: context.userId,
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
            node_id: entryId,
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
    const workspace = await this.fetchWorkspace(userId);
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const ancestorRows = await fetchEntryAncestors(workspaceDatabase, entryId);
    const ancestors = ancestorRows.map(mapEntry);

    const entry = ancestors.find((ancestor) => ancestor.id === entryId);
    if (!entry) {
      throw new Error('Entry not found');
    }

    const model = registry.getModel(entry.type);
    const context = new EntryMutationContext(
      workspace.account_id,
      workspace.workspace_id,
      userId,
      workspace.role,
      ancestors
    );

    if (!model.canDelete(context, entry)) {
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

        await trx
          .deleteFrom('entry_transactions')
          .where('entry_id', '=', entryId)
          .execute();

        await trx
          .deleteFrom('collaborations')
          .where('entry_id', '=', entryId)
          .execute();

        await trx.deleteFrom('texts').where('id', '=', entryId).execute();

        const createdTransaction = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: generateId(IdType.Transaction),
            entry_id: entryId,
            root_id: entry.rootId,
            operation: 'delete',
            data: null,
            created_at: new Date().toISOString(),
            created_by: context.userId,
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
            node_id: entryId,
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
    if (transaction.operation === 'create') {
      await this.applyServerCreateTransaction(userId, transaction);
    } else if (transaction.operation === 'update') {
      await this.applyServerUpdateTransaction(userId, transaction);
    } else if (transaction.operation === 'delete') {
      await this.applyServerDeleteTransaction(userId, transaction);
    }
  }

  public async replaceTransactions(
    userId: string,
    entryId: string,
    transactions: SyncEntryTransactionData[],
    transactionCursor: bigint
  ): Promise<boolean> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryReplaceTransactions(
        userId,
        entryId,
        transactions,
        transactionCursor
      );

      if (result !== null) {
        return result;
      }
    }

    return false;
  }

  public async tryReplaceTransactions(
    userId: string,
    entryId: string,
    transactions: SyncEntryTransactionData[],
    transactionCursor: bigint
  ): Promise<boolean | null> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const firstTransaction = transactions[0];
    if (!firstTransaction || firstTransaction.operation !== 'create') {
      return false;
    }

    if (transactionCursor < BigInt(firstTransaction.version)) {
      return false;
    }

    const lastTransaction = transactions[transactions.length - 1];
    if (!lastTransaction) {
      return false;
    }

    const ydoc = new YDoc();
    for (const transaction of transactions) {
      if (transaction.operation === 'delete') {
        await this.applyServerDeleteTransaction(userId, transaction);
        return true;
      }

      ydoc.applyUpdate(transaction.data);
    }

    const attributes = ydoc.getAttributes<EntryAttributes>();
    const model = registry.getModel(attributes.type);
    if (!model) {
      return false;
    }

    const attributesJson = JSON.stringify(attributes);
    const text = model.getText(entryId, attributes);

    const existingEntry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', entryId)
      .executeTakeFirst();

    if (existingEntry) {
      const updatedEntry = await workspaceDatabase
        .transaction()
        .execute(async (trx) => {
          const updatedEntry = await trx
            .updateTable('entries')
            .returningAll()
            .set({
              attributes: attributesJson,
              updated_at:
                firstTransaction.id !== lastTransaction.id
                  ? lastTransaction.createdAt
                  : null,
              updated_by:
                firstTransaction.id !== lastTransaction.id
                  ? lastTransaction.createdBy
                  : null,
              transaction_id: lastTransaction.id,
            })
            .where('id', '=', entryId)
            .where('transaction_id', '=', existingEntry.transaction_id)
            .executeTakeFirst();

          if (!updatedEntry) {
            return undefined;
          }

          await trx
            .deleteFrom('entry_transactions')
            .where('entry_id', '=', entryId)
            .execute();

          await trx
            .insertInto('entry_transactions')
            .values(
              transactions.map((t) => ({
                id: t.id,
                entry_id: t.entryId,
                root_id: t.rootId,
                operation: t.operation,
                data:
                  t.operation !== 'delete' && t.data
                    ? decodeState(t.data)
                    : null,
                created_at: t.createdAt,
                created_by: t.createdBy,
                retry_count: 0,
                status: 'synced',
                version: BigInt(t.version),
                server_created_at: t.serverCreatedAt,
              }))
            )
            .execute();

          if (text !== undefined) {
            await trx.deleteFrom('texts').where('id', '=', entryId).execute();
          }

          if (text) {
            await trx
              .insertInto('texts')
              .values({ id: entryId, name: text.name, text: text.text })
              .execute();
          }
        });

      if (updatedEntry) {
        eventBus.publish({
          type: 'entry_updated',
          userId,
          entry: mapEntry(updatedEntry),
        });

        return true;
      }

      return null;
    }

    const createdEntry = await workspaceDatabase
      .transaction()
      .execute(async (trx) => {
        const createdEntry = await trx
          .insertInto('entries')
          .returningAll()
          .values({
            id: entryId,
            root_id: firstTransaction.rootId,
            attributes: attributesJson,
            created_at: firstTransaction.createdAt,
            created_by: firstTransaction.createdBy,
            updated_at:
              firstTransaction.id !== lastTransaction.id
                ? lastTransaction.createdAt
                : null,
            updated_by:
              firstTransaction.id !== lastTransaction.id
                ? lastTransaction.createdBy
                : null,
            transaction_id: lastTransaction.id,
          })
          .onConflict((b) => b.doNothing())
          .executeTakeFirst();

        if (!createdEntry) {
          return undefined;
        }

        await trx
          .deleteFrom('entry_transactions')
          .where('entry_id', '=', entryId)
          .execute();

        await trx
          .insertInto('entry_transactions')
          .values(
            transactions.map((t) => ({
              id: t.id,
              entry_id: t.entryId,
              root_id: t.rootId,
              operation: t.operation,
              data:
                t.operation !== 'delete' && t.data ? decodeState(t.data) : null,
              created_at: t.createdAt,
              created_by: t.createdBy,
              retry_count: 0,
              status: 'synced',
              version: BigInt(t.version),
              server_created_at: t.serverCreatedAt,
            }))
          )
          .execute();

        if (text !== undefined) {
          await trx.deleteFrom('texts').where('id', '=', entryId).execute();
        }

        if (text) {
          await trx
            .insertInto('texts')
            .values({ id: entryId, name: text.name, text: text.text })
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

    return null;
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

    const model = registry.getModel(attributes.type);
    if (!model) {
      return;
    }

    const text = model.getText(transaction.entryId, attributes);

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
            operation: 'create',
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
        `Server update transaction ${transaction.id} for entry ${transaction.entryId} has been synced`
      );
      return;
    }

    const model = registry.getModel(transaction.entryId);
    if (!model) {
      return;
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
    const text = model.getText(transaction.entryId, attributes);

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
          .executeTakeFirst();

        await trx
          .insertInto('entry_transactions')
          .values({
            id: transaction.id,
            entry_id: transaction.entryId,
            root_id: transaction.rootId,
            operation: 'update',
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
      return;
    }

    this.debug(
      `Updated entry ${updatedEntry.id} with type ${updatedEntry.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'entry_updated',
      userId,
      entry: mapEntry(updatedEntry),
    });
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

    const entry = await workspaceDatabase
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', transaction.entryId)
      .executeTakeFirst();

    if (!entry) {
      return;
    }

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('entries')
        .where('id', '=', transaction.entryId)
        .execute();
      await trx
        .deleteFrom('entry_transactions')
        .where('entry_id', '=', transaction.entryId)
        .execute();

      await trx
        .deleteFrom('collaborations')
        .where('entry_id', '=', transaction.entryId)
        .execute();

      await trx
        .deleteFrom('texts')
        .where('id', '=', transaction.entryId)
        .execute();
    });

    this.debug(
      `Deleted entry ${entry.id} with type ${entry.type} with transaction ${transaction.id}`
    );

    eventBus.publish({
      type: 'entry_deleted',
      userId,
      entry: mapEntry(entry),
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
        .deleteFrom('collaborations')
        .where('entry_id', '=', transaction.entryId)
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

    const model = registry.getModel(entry.type);
    if (!model) {
      return true;
    }

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

    await workspaceDatabase
      .deleteFrom('entry_transactions')
      .where('id', '=', transaction.id)
      .execute();
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

  private async fetchWorkspace(userId: string): Promise<SelectWorkspace> {
    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }
}

export const entryService = new EntryService();
