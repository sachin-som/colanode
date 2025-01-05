import {
  extractEntryCollaborators,
  generateId,
  IdType,
  EntryAttributes,
  EntryRole,
  MarkEntrySeenMutation,
  MarkEntryOpenedMutation,
  extractEntryRole,
  hasEntryRole,
  entryAttributesSchema,
  canCreateEntry,
  canUpdateEntry,
  canDeleteEntry,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';
import { Transaction } from 'kysely';
import { cloneDeep } from 'lodash-es';

import { jobService } from '@/services/job-service';
import { database } from '@/data/database';
import {
  CreateEntry,
  CreateCollaboration,
  CreateEntryTransaction,
  DatabaseSchema,
  SelectUser,
  SelectCollaboration,
} from '@/data/schema';
import { eventBus } from '@/lib/event-bus';
import { fetchEntry, mapEntry } from '@/lib/entries';
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
import { configuration } from '@/lib/configuration';

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
    const ydoc = new YDoc();
    const update = ydoc.updateAttributes(
      entryAttributesSchema,
      input.attributes
    );
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

    const createTransaction: CreateEntryTransaction = {
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

      await this.scheduleEntryEmbedding(input.entryId);

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
    const entryRow = await fetchEntry(input.entryId);
    if (!entryRow) {
      return { type: 'error', output: null };
    }

    const entry = mapEntry(entryRow);
    const previousTransactions = await database
      .selectFrom('entry_transactions')
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

    const update = ydoc.updateAttributes(
      entryAttributesSchema,
      updatedAttributes
    );

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
          .insertInto('entry_transactions')
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

      await this.scheduleEntryEmbedding(input.entryId);

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
    const root = await fetchEntry(input.rootId);
    const ydoc = new YDoc();
    ydoc.applyUpdate(input.data);
    const attributes = ydoc.getAttributes<EntryAttributes>();

    if (
      !canCreateEntry(
        {
          user: {
            userId: user.id,
            role: user.role,
          },
          root: root ? mapEntry(root) : null,
        },
        attributes
      )
    ) {
      return null;
    }

    const createEntry: CreateEntry = {
      id: input.entryId,
      root_id: input.rootId,
      attributes: JSON.stringify(attributes),
      workspace_id: user.workspace_id,
      created_at: input.createdAt,
      created_by: user.id,
      transaction_id: input.id,
    };

    const createTransaction: CreateEntryTransaction = {
      id: input.id,
      entry_id: input.entryId,
      root_id: input.rootId,
      workspace_id: user.workspace_id,
      operation: 'create',
      data:
        typeof input.data === 'string' ? decodeState(input.data) : input.data,
      created_at: input.createdAt,
      created_by: user.id,
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
        workspaceId: user.workspace_id,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: user.workspace_id,
        });
      }

      await this.scheduleEntryEmbedding(input.entryId);

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
    const root = await fetchEntry(input.rootId);
    if (!root) {
      return { type: 'error', output: null };
    }

    const entry = await fetchEntry(input.entryId);
    if (!entry) {
      return { type: 'error', output: null };
    }

    const previousTransactions = await database
      .selectFrom('entry_transactions')
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

    if (
      !canUpdateEntry(
        {
          user: {
            userId: user.id,
            role: user.role,
          },
          root: mapEntry(root),
          entry: mapEntry(entry),
        },
        attributes
      )
    ) {
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
          .where('transaction_id', '=', entry.transaction_id)
          .executeTakeFirst();

        if (!updatedEntry) {
          throw new Error('Failed to update entry');
        }

        const createdTransaction = await trx
          .insertInto('entry_transactions')
          .returningAll()
          .values({
            id: input.id,
            entry_id: input.entryId,
            root_id: input.rootId,
            workspace_id: user.workspace_id,
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
            input.userId,
            user.workspace_id,
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
        rootId: entry.root_id,
        workspaceId: user.workspace_id,
      });

      for (const createdCollaboration of createdCollaborations) {
        eventBus.publish({
          type: 'collaboration_created',
          collaboratorId: createdCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: user.workspace_id,
        });
      }

      for (const updatedCollaboration of updatedCollaborations) {
        eventBus.publish({
          type: 'collaboration_updated',
          collaboratorId: updatedCollaboration.collaborator_id,
          entryId: input.entryId,
          workspaceId: user.workspace_id,
        });
      }

      await this.scheduleEntryEmbedding(input.entryId);

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
    const entry = await fetchEntry(input.entryId);
    if (!entry) {
      return null;
    }

    const root = await fetchEntry(entry.root_id);
    if (!root) {
      return null;
    }

    if (
      !canDeleteEntry({
        user: {
          userId: user.id,
          role: user.role,
        },
        root: mapEntry(root),
        entry: mapEntry(entry),
      })
    ) {
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
          .deleteFrom('entry_transactions')
          .where('entry_id', '=', input.entryId)
          .execute();

        const createdTransaction = await trx
          .insertInto('entry_transactions')
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
      rootId: entry.root_id,
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

  public async markEntryAsSeen(
    user: SelectUser,
    mutation: MarkEntrySeenMutation
  ): Promise<boolean> {
    const entry = await database
      .selectFrom('entries')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.entryId)
      .executeTakeFirst();

    if (!entry) {
      return false;
    }

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', entry.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!role || !hasEntryRole(role, 'viewer')) {
      return false;
    }

    const existingInteraction = await database
      .selectFrom('entry_interactions')
      .selectAll()
      .where('entry_id', '=', mutation.data.entryId)
      .where('collaborator_id', '=', user.id)
      .executeTakeFirst();

    if (
      existingInteraction &&
      existingInteraction.last_seen_at !== null &&
      existingInteraction.last_seen_at <= new Date(mutation.data.seenAt)
    ) {
      return true;
    }

    const lastSeenAt = new Date(mutation.data.seenAt);
    const firstSeenAt = existingInteraction?.first_seen_at ?? lastSeenAt;
    const createdInteraction = await database
      .insertInto('entry_interactions')
      .returningAll()
      .values({
        entry_id: mutation.data.entryId,
        collaborator_id: user.id,
        first_seen_at: firstSeenAt,
        last_seen_at: lastSeenAt,
        root_id: root.id,
        workspace_id: root.workspace_id,
      })
      .onConflict((b) =>
        b.columns(['entry_id', 'collaborator_id']).doUpdateSet({
          last_seen_at: lastSeenAt,
          first_seen_at: firstSeenAt,
        })
      )
      .executeTakeFirst();

    if (!createdInteraction) {
      return false;
    }

    eventBus.publish({
      type: 'entry_interaction_updated',
      entryId: createdInteraction.entry_id,
      collaboratorId: createdInteraction.collaborator_id,
      rootId: createdInteraction.root_id,
      workspaceId: createdInteraction.workspace_id,
    });

    return true;
  }

  public async markEntryAsOpened(
    user: SelectUser,
    mutation: MarkEntryOpenedMutation
  ): Promise<boolean> {
    const entry = await database
      .selectFrom('entries')
      .select(['id', 'root_id', 'workspace_id'])
      .where('id', '=', mutation.data.entryId)
      .executeTakeFirst();

    if (!entry) {
      return false;
    }

    const root = await database
      .selectFrom('entries')
      .selectAll()
      .where('id', '=', entry.root_id)
      .executeTakeFirst();

    if (!root) {
      return false;
    }

    const rootEntry = mapEntry(root);
    const role = extractEntryRole(rootEntry, user.id);
    if (!role || !hasEntryRole(role, 'viewer')) {
      return false;
    }

    const existingInteraction = await database
      .selectFrom('entry_interactions')
      .selectAll()
      .where('entry_id', '=', mutation.data.entryId)
      .where('collaborator_id', '=', user.id)
      .executeTakeFirst();

    if (
      existingInteraction &&
      existingInteraction.last_opened_at !== null &&
      existingInteraction.last_opened_at <= new Date(mutation.data.openedAt)
    ) {
      return true;
    }

    const lastOpenedAt = new Date(mutation.data.openedAt);
    const firstOpenedAt = existingInteraction?.first_opened_at ?? lastOpenedAt;
    const createdInteraction = await database
      .insertInto('entry_interactions')
      .returningAll()
      .values({
        entry_id: mutation.data.entryId,
        collaborator_id: user.id,
        first_opened_at: firstOpenedAt,
        last_opened_at: lastOpenedAt,
        root_id: root.id,
        workspace_id: root.workspace_id,
      })
      .onConflict((b) =>
        b.columns(['entry_id', 'collaborator_id']).doUpdateSet({
          last_opened_at: lastOpenedAt,
          first_opened_at: firstOpenedAt,
        })
      )
      .executeTakeFirst();

    if (!createdInteraction) {
      return false;
    }

    eventBus.publish({
      type: 'entry_interaction_updated',
      entryId: createdInteraction.entry_id,
      collaboratorId: createdInteraction.collaborator_id,
      rootId: createdInteraction.root_id,
      workspaceId: createdInteraction.workspace_id,
    });

    return true;
  }

  private async applyDatabaseCreateTransaction(
    attributes: EntryAttributes,
    entry: CreateEntry,
    transaction: CreateEntryTransaction
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
        .insertInto('entry_transactions')
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

  private async scheduleEntryEmbedding(entryId: string) {
    await jobService.addJob(
      {
        type: 'embed_entry',
        entryId,
      },
      {
        jobId: `embed_entry:${entryId}`,
        delay: configuration.ai.entryEmbedDelay,
      }
    );
  }
}

export const entryService = new EntryService();
