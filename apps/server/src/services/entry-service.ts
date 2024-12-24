import {
  extractEntryCollaborators,
  generateId,
  IdType,
  EntryAttributes,
  EntryMutationContext,
  EntryRole,
  registry,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { Transaction } from 'kysely';
import { cloneDeep } from 'lodash-es';

import { jobService } from '@/services/job-service';
import { database } from '@/data/database';
import {
  CreateEntry,
  CreateCollaboration,
  CreateTransaction,
  DatabaseSchema,
  SelectUser,
  SelectCollaboration,
} from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { fetchEntryAncestors, mapEntry } from '@/lib/entries';
import { createLogger } from '@/lib/logger';
import {
  ApplyCreateTransactionInput,
  ApplyCreateTransactionOutput,
  ApplyDeleteTransactionInput,
  ApplyDeleteTransactionOutput,
  ApplyUpdateTransactionInput,
  ApplyUpdateTransactionOutput,
  CreateEntryInput,
  CreateEntryOutput,
  UpdateEntryInput,
  UpdateEntryOutput,
} from '@/types/entries';

const UPDATE_RETRIES_LIMIT = 10;

type UpdateResult<T> = {
  type: 'success' | 'error' | 'retry';
  output: T | null;
};

type CollaboratorChangeResult = {
  addedCollaborators: Record<string, EntryRole>;
  updatedCollaborators: Record<string, EntryRole>;
  removedCollaborators: Record<string, EntryRole>;
};

class EntryService {
  private readonly logger = createLogger('node-service');

  public async createEntry(
    input: CreateEntryInput
  ): Promise<CreateEntryOutput | null> {
    const model = registry.getModel(input.attributes.type);
    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(model.schema, input.attributes);
    const attributes = ydoc.getAttributes<EntryAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const createEntry: CreateEntry = {
      id: input.entryId,
      root_id: input.rootId,
      workspace_id: input.workspaceId,
      attributes: attributesJson,
      created_at: date,
      created_by: input.userId,
      transaction_id: transactionId,
    };

    const createTransaction: CreateTransaction = {
      id: transactionId,
      root_id: input.rootId,
      entry_id: input.entryId,
      workspace_id: input.workspaceId,
      operation: 'create',
      data: update,
      created_at: date,
      created_by: input.userId,
      server_created_at: date,
    };

    try {
      const { createdEntry, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createEntry,
          createTransaction
        );

      eventBus.publish({
        type: 'entry_created',
        entryId: input.entryId,
        entryType: input.attributes.type,
        rootId: input.rootId,
        workspaceId: input.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: input.workspaceId,
        });
      }

      return {
        entry: createdEntry,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to create node transaction');
      return null;
    }
  }

  public async updateEntry(
    input: UpdateEntryInput
  ): Promise<UpdateEntryOutput | null> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryUpdateEntry(input);

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }
    }

    return null;
  }

  private async tryUpdateEntry(
    input: UpdateEntryInput
  ): Promise<UpdateResult<UpdateEntryOutput>> {
    const ancestorRows = await fetchEntryAncestors(input.entryId);
    const ancestors = ancestorRows.map(mapEntry);

    const entry = ancestors.find((ancestor) => ancestor.id === input.entryId);
    if (!entry) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('entry_id', '=', input.entryId)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const transaction of previousTransactions) {
      if (transaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(transaction.data);
    }

    const currentAttributes = ydoc.getAttributes<EntryAttributes>();
    const updatedAttributes = input.updater(cloneDeep(currentAttributes));
    if (!updatedAttributes) {
      return { type: 'error', output: null };
    }

    const model = registry.getModel(updatedAttributes.type);
    const update = ydoc.updateAttributes(model.schema, updatedAttributes);

    const attributes = ydoc.getAttributes<EntryAttributes>();
    const attributesJson = JSON.stringify(attributes);

    const date = new Date();
    const transactionId = generateId(IdType.Transaction);

    const collaboratorChanges = this.checkCollaboratorChanges(
      entry.attributes,
      attributes
    );

    try {
      const {
        updatedEntry,
        createdTransaction,
        createdCollaborations,
        updatedCollaborations,
      } = await database.transaction().execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: date,
            updated_by: input.userId,
            transaction_id: transactionId,
          })
          .where('id', '=', input.entryId)
          .where('transaction_id', '=', entry.transactionId)
          .executeTakeFirst();

        if (!updatedEntry) {
          throw new Error('Failed to update entry');
        }

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: transactionId,
            entry_id: input.entryId,
            root_id: entry.rootId,
            workspace_id: input.workspaceId,
            operation: 'update',
            data: update,
            created_at: date,
            created_by: input.userId,
            server_created_at: date,
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const { createdCollaborations, updatedCollaborations } =
          await this.applyCollaboratorUpdates(
            trx,
            input.entryId,
            entry.rootId,
            input.userId,
            input.workspaceId,
            collaboratorChanges
          );

        return {
          updatedEntry,
          createdTransaction,
          createdCollaborations,
          updatedCollaborations,
        };
      });

      eventBus.publish({
        type: 'entry_updated',
        entryId: input.entryId,
        entryType: entry.type,
        rootId: entry.rootId,
        workspaceId: input.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: input.workspaceId,
        });
      }

      for (const updatedCollaboration of updatedCollaborations) {
        eventBus.publish({
          type: 'collaboration_updated',
          collaboratorId: updatedCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: input.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          entry: updatedEntry,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyCreateTransaction(
    user: SelectUser,
    input: ApplyCreateTransactionInput
  ): Promise<ApplyCreateTransactionOutput | null> {
    const ydoc = new YDoc();
    ydoc.applyUpdate(input.data);
    const attributes = ydoc.getAttributes<EntryAttributes>();

    const ancestorRows = attributes.parentId
      ? await fetchEntryAncestors(attributes.parentId)
      : [];

    const ancestors = ancestorRows.map(mapEntry);
    const context = new EntryMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return null;
    }

    if (!model.canCreate(context, attributes)) {
      return null;
    }

    const createEntry: CreateEntry = {
      id: input.entryId,
      root_id: input.rootId,
      attributes: JSON.stringify(attributes),
      workspace_id: context.workspaceId,
      created_at: input.createdAt,
      created_by: context.userId,
      transaction_id: input.id,
    };

    const createTransaction: CreateTransaction = {
      id: input.id,
      entry_id: input.entryId,
      root_id: input.rootId,
      workspace_id: context.workspaceId,
      operation: 'create',
      data:
        typeof input.data === 'string' ? decodeState(input.data) : input.data,
      created_at: input.createdAt,
      created_by: context.userId,
      server_created_at: new Date(),
    };

    try {
      const { createdEntry, createdTransaction, createdCollaborations } =
        await this.applyDatabaseCreateTransaction(
          attributes,
          createEntry,
          createTransaction
        );

      eventBus.publish({
        type: 'entry_created',
        entryId: input.entryId,
        entryType: attributes.type,
        rootId: input.rootId,
        workspaceId: context.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: context.workspaceId,
        });
      }

      return {
        entry: createdEntry,
        transaction: createdTransaction,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to apply node create transaction');
      return null;
    }
  }

  public async applyUpdateTransaction(
    user: SelectUser,
    input: ApplyUpdateTransactionInput
  ): Promise<ApplyUpdateTransactionOutput | null> {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      const result = await this.tryApplyUpdateTransaction(user, input);

      if (result.type === 'success') {
        return result.output;
      }

      if (result.type === 'error') {
        return null;
      }
    }

    return null;
  }

  private async tryApplyUpdateTransaction(
    user: SelectUser,
    input: ApplyUpdateTransactionInput
  ): Promise<UpdateResult<ApplyUpdateTransactionOutput>> {
    const ancestorRows = await fetchEntryAncestors(input.entryId);
    const ancestors = ancestorRows.map(mapEntry);

    const entry = ancestors.find((ancestor) => ancestor.id === input.entryId);
    if (!entry) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('transactions')
      .selectAll()
      .where('entry_id', '=', input.entryId)
      .orderBy('version', 'asc')
      .execute();

    const ydoc = new YDoc();
    for (const previousTransaction of previousTransactions) {
      if (previousTransaction.data === null) {
        return { type: 'error', output: null };
      }

      ydoc.applyUpdate(previousTransaction.data);
    }

    ydoc.applyUpdate(input.data);

    const attributes = ydoc.getAttributes<EntryAttributes>();
    const attributesJson = JSON.stringify(attributes);
    const model = registry.getModel(attributes.type);
    if (!model.schema.safeParse(attributes).success) {
      return { type: 'error', output: null };
    }

    const context = new EntryMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    if (!model.canUpdate(context, entry, attributes)) {
      return { type: 'error', output: null };
    }

    const collaboratorChanges = this.checkCollaboratorChanges(
      entry.attributes,
      attributes
    );

    try {
      const {
        updatedEntry,
        createdTransaction,
        createdCollaborations,
        updatedCollaborations,
      } = await database.transaction().execute(async (trx) => {
        const updatedEntry = await trx
          .updateTable('entries')
          .returningAll()
          .set({
            attributes: attributesJson,
            updated_at: input.createdAt,
            updated_by: input.userId,
            transaction_id: input.id,
          })
          .where('id', '=', input.entryId)
          .where('transaction_id', '=', entry.transactionId)
          .executeTakeFirst();

        if (!updatedEntry) {
          throw new Error('Failed to update entry');
        }

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: input.id,
            entry_id: input.entryId,
            root_id: input.rootId,
            workspace_id: context.workspaceId,
            operation: 'update',
            data:
              typeof input.data === 'string'
                ? decodeState(input.data)
                : input.data,
            created_at: input.createdAt,
            created_by: input.userId,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const { createdCollaborations, updatedCollaborations } =
          await this.applyCollaboratorUpdates(
            trx,
            input.entryId,
            input.rootId,
            input.userId,
            context.workspaceId,
            collaboratorChanges
          );

        return {
          updatedEntry,
          createdTransaction,
          createdCollaborations,
          updatedCollaborations,
        };
      });

      eventBus.publish({
        type: 'entry_updated',
        entryId: input.entryId,
        entryType: entry.type,
        rootId: entry.rootId,
        workspaceId: context.workspaceId,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: context.workspaceId,
        });
      }

      for (const updatedCollaboration of updatedCollaborations) {
        eventBus.publish({
          type: 'collaboration_updated',
          collaboratorId: updatedCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: context.workspaceId,
        });
      }

      return {
        type: 'success',
        output: {
          entry: updatedEntry,
          transaction: createdTransaction,
        },
      };
    } catch {
      return { type: 'retry', output: null };
    }
  }

  public async applyDeleteTransaction(
    user: SelectUser,
    input: ApplyDeleteTransactionInput
  ): Promise<ApplyDeleteTransactionOutput | null> {
    const ancestorRows = await fetchEntryAncestors(input.entryId);
    const ancestors = ancestorRows.map(mapEntry);
    const entry = ancestors.find((ancestor) => ancestor.id === input.entryId);
    if (!entry) {
      return null;
    }

    const model = registry.getModel(entry.attributes.type);
    const context = new EntryMutationContext(
      user.account_id,
      user.workspace_id,
      user.id,
      user.role,
      ancestors
    );

    if (!model.canDelete(context, entry)) {
      return null;
    }

    const { deletedEntry, createdTransaction, updatedCollaborations } =
      await database.transaction().execute(async (trx) => {
        const deletedEntry = await trx
          .deleteFrom('entries')
          .returningAll()
          .where('id', '=', input.entryId)
          .executeTakeFirst();

        if (!deletedEntry) {
          throw new Error('Failed to delete entry');
        }

        await trx
          .deleteFrom('transactions')
          .where('entry_id', '=', input.entryId)
          .execute();

        const createdTransaction = await trx
          .insertInto('transactions')
          .returningAll()
          .values({
            id: input.id,
            entry_id: input.entryId,
            root_id: input.rootId,
            workspace_id: user.workspace_id,
            operation: 'delete',
            created_at: input.createdAt,
            created_by: user.id,
            server_created_at: new Date(),
          })
          .executeTakeFirst();

        if (!createdTransaction) {
          throw new Error('Failed to create transaction');
        }

        const updatedCollaborations = await trx
          .updateTable('collaborations')
          .set({
            deleted_at: new Date(),
            deleted_by: user.id,
          })
          .returningAll()
          .where('entry_id', '=', input.entryId)
          .execute();

        return {
          deletedEntry,
          createdTransaction,
          updatedCollaborations,
        };
      });

    eventBus.publish({
      type: 'entry_deleted',
      entryId: input.entryId,
      entryType: entry.type,
      rootId: entry.rootId,
      workspaceId: user.workspace_id,
    });

    for (const updatedCollaboration of updatedCollaborations) {
      eventBus.publish({
        type: 'collaboration_updated',
        collaboratorId: updatedCollaboration.collaborator_id,
        entryId: input.entryId,
        workspaceId: user.workspace_id,
      });
    }

    await jobService.addJob({
      type: 'clean_entry_data',
      entryId: input.entryId,
      workspaceId: user.workspace_id,
    });

    return {
      entry: deletedEntry,
      transaction: createdTransaction,
    };
  }

  private async applyDatabaseCreateTransaction(
    attributes: EntryAttributes,
    entry: CreateEntry,
    transaction: CreateTransaction
  ) {
    const collaborationsToCreate: CreateCollaboration[] = Object.entries(
      extractEntryCollaborators(attributes)
    ).map(([userId, role]) => ({
      collaborator_id: userId,
      entry_id: entry.id,
      workspace_id: entry.workspace_id,
      role,
      created_at: new Date(),
      created_by: transaction.created_by,
    }));

    return await database.transaction().execute(async (trx) => {
      const createdEntry = await trx
        .insertInto('entries')
        .returningAll()
        .values(entry)
        .executeTakeFirst();

      if (!createdEntry) {
        throw new Error('Failed to create entry');
      }

      const createdTransaction = await trx
        .insertInto('transactions')
        .returningAll()
        .values(transaction)
        .executeTakeFirst();

      if (!createdTransaction) {
        throw new Error('Failed to create transaction');
      }

      if (collaborationsToCreate.length > 0) {
        const createdCollaborations = await trx
          .insertInto('collaborations')
          .returningAll()
          .values(collaborationsToCreate)
          .execute();

        if (createdCollaborations.length !== collaborationsToCreate.length) {
          throw new Error('Failed to create collaborations');
        }

        return { createdEntry, createdTransaction, createdCollaborations };
      }

      return { createdEntry, createdTransaction, createdCollaborations: [] };
    });
  }

  private async applyCollaboratorUpdates(
    transaction: Transaction<DatabaseSchema>,
    entryId: string,
    rootId: string,
    userId: string,
    workspaceId: string,
    updateResult: CollaboratorChangeResult
  ) {
    const createdCollaborations: SelectCollaboration[] = [];
    const updatedCollaborations: SelectCollaboration[] = [];

    for (const [collaboratorId, role] of Object.entries(
      updateResult.addedCollaborators
    )) {
      const createdCollaboration = await transaction
        .insertInto('collaborations')
        .returningAll()
        .values({
          collaborator_id: collaboratorId,
          entry_id: entryId,
          workspace_id: workspaceId,
          role,
          created_at: new Date(),
          created_by: userId,
        })
        .onConflict((oc) =>
          oc.columns(['collaborator_id', 'entry_id']).doUpdateSet({
            role,
            updated_at: new Date(),
            updated_by: userId,
            deleted_at: null,
            deleted_by: null,
          })
        )
        .executeTakeFirst();

      if (!createdCollaboration) {
        throw new Error('Failed to create collaboration');
      }

      createdCollaborations.push(createdCollaboration);
    }

    for (const [collaboratorId, role] of Object.entries(
      updateResult.updatedCollaborators
    )) {
      const updatedCollaboration = await transaction
        .updateTable('collaborations')
        .returningAll()
        .set({
          role,
          updated_at: new Date(),
          updated_by: userId,
          deleted_at: null,
          deleted_by: null,
        })
        .where('collaborator_id', '=', collaboratorId)
        .where('entry_id', '=', entryId)
        .executeTakeFirst();

      if (!updatedCollaboration) {
        throw new Error('Failed to update collaboration');
      }

      updatedCollaborations.push(updatedCollaboration);
    }

    const removedCollaboratorIds = Object.keys(
      updateResult.removedCollaborators
    );

    if (removedCollaboratorIds.length > 0) {
      const removedCollaborations = await transaction
        .updateTable('collaborations')
        .returningAll()
        .set({
          deleted_at: new Date(),
          deleted_by: userId,
        })
        .where('collaborator_id', 'in', removedCollaboratorIds)
        .where('entry_id', '=', entryId)
        .execute();

      if (removedCollaborations.length !== removedCollaboratorIds.length) {
        throw new Error('Failed to remove collaborations');
      }

      updatedCollaborations.push(...removedCollaborations);
    }

    return { createdCollaborations, updatedCollaborations };
  }

  private checkCollaboratorChanges(
    beforeAttributes: EntryAttributes,
    afterAttributes: EntryAttributes
  ): CollaboratorChangeResult {
    const beforeCollaborators = extractEntryCollaborators(beforeAttributes);
    const afterCollaborators = extractEntryCollaborators(afterAttributes);

    const addedCollaborators: Record<string, EntryRole> = {};
    const updatedCollaborators: Record<string, EntryRole> = {};
    const removedCollaborators: Record<string, EntryRole> = {};

    // Check for added and updated collaborators
    for (const [userId, newRole] of Object.entries(afterCollaborators)) {
      if (!(userId in beforeCollaborators)) {
        addedCollaborators[userId] = newRole;
      } else if (beforeCollaborators[userId] !== newRole) {
        updatedCollaborators[userId] = newRole;
      }
    }

    // Check for removed collaborators
    for (const [userId, oldRole] of Object.entries(beforeCollaborators)) {
      if (!(userId in afterCollaborators)) {
        removedCollaborators[userId] = oldRole;
      }
    }

    return {
      addedCollaborators,
      updatedCollaborators,
      removedCollaborators,
    };
  }
}

export const entryService = new EntryService();
