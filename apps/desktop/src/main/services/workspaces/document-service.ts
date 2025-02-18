import {
  CanUpdateDocumentContext,
  createDebugger,
  DocumentContent,
  generateId,
  getNodeModel,
  IdType,
  SyncDocumentUpdateData,
  UpdateDocumentMutationData,
} from '@colanode/core';
import { encodeState, YDoc } from '@colanode/crdt';

import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { eventBus } from '@/shared/lib/event-bus';
import { fetchNodeTree } from '@/main/lib/utils';
import { mapNode } from '@/main/lib/mappers';

const UPDATE_RETRIES_LIMIT = 10;

export class DocumentService {
  private readonly debug = createDebugger('desktop:service:document');
  private readonly workspace: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspace = workspaceService;
  }

  public async updateDocument(id: string, update: Uint8Array) {
    const tree = await fetchNodeTree(this.workspace.database, id);
    if (!tree) {
      throw new Error('Node not found');
    }

    const node = tree[tree.length - 1];
    if (!node) {
      throw new Error('Node not found');
    }

    const model = getNodeModel(node.type);
    if (!model.documentSchema) {
      throw new Error('Node does not have a document schema');
    }

    const context: CanUpdateDocumentContext = {
      user: {
        id: this.workspace.userId,
        role: this.workspace.role,
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
      },
      node: mapNode(node),
      tree: tree.map((node) => mapNode(node)),
    };

    if (!model.canUpdateDocument(context)) {
      throw new Error('User does not have permission to update document');
    }

    const document = await this.workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', node.id)
      .executeTakeFirst();

    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', node.id)
      .orderBy('id', 'asc')
      .execute();

    const ydoc = new YDoc(document?.state);
    for (const update of documentUpdates) {
      ydoc.applyUpdate(update.data);
    }

    ydoc.applyUpdate(update);

    const content = ydoc.getObject<DocumentContent>();
    if (!model.documentSchema.safeParse(content).success) {
      throw new Error('Invalid document state');
    }

    const updateId = generateId(IdType.Update);
    const updatedAt = new Date().toISOString();

    const { createdUpdate, createdMutation } = await this.workspace.database
      .transaction()
      .execute(async (trx) => {
        const createdUpdate = await trx
          .insertInto('document_updates')
          .returningAll()
          .values({
            id: updateId,
            document_id: node.id,
            data: update,
            created_at: updatedAt,
          })
          .executeTakeFirst();

        if (!createdUpdate) {
          throw new Error('Failed to create update');
        }

        const mutationData: UpdateDocumentMutationData = {
          documentId: id,
          updateId: updateId,
          data: encodeState(update),
          createdAt: updatedAt,
        };

        const createdMutation = await trx
          .insertInto('mutations')
          .returningAll()
          .values({
            id: generateId(IdType.Mutation),
            type: 'update_document',
            data: JSON.stringify(mutationData),
            created_at: updatedAt,
            retries: 0,
          })
          .executeTakeFirst();

        if (!createdMutation) {
          throw new Error('Failed to create mutation');
        }

        return {
          createdUpdate,
          createdMutation,
        };
      });

    if (createdUpdate) {
      eventBus.publish({
        type: 'document_update_created',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentId: node.id,
        updateId: createdUpdate.id,
      });
    }

    if (createdMutation) {
      this.workspace.mutations.triggerSync();
    }
  }

  public async revertDocumentUpdate(data: UpdateDocumentMutationData) {
    const update = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('id', '=', data.updateId)
      .executeTakeFirst();

    if (!update) {
      return;
    }

    const deletedUpdate = await this.workspace.database
      .deleteFrom('document_updates')
      .where('id', '=', update.id)
      .executeTakeFirst();

    if (!deletedUpdate) {
      return;
    }

    eventBus.publish({
      type: 'document_update_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      documentId: data.documentId,
      updateId: data.updateId,
    });
  }

  public async syncServerDocumentUpdate(data: SyncDocumentUpdateData) {
    for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
      try {
        const result = await this.trySyncDocumentUpdate(data);
        if (result) {
          return;
        }
      } catch (error) {
        this.debug(`Failed to sync document update ${data.id}: ${error}`);
      }
    }
  }

  private async trySyncDocumentUpdate(
    data: SyncDocumentUpdateData
  ): Promise<boolean> {
    const document = await this.workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', data.documentId)
      .executeTakeFirst();

    const documentUpdates = await this.workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', data.documentId)
      .orderBy('id', 'asc')
      .execute();

    const mergedUpdateIds =
      data.mergedUpdates?.map((update) => update.id) ?? [];

    const ydoc = new YDoc(document?.state);
    for (const update of documentUpdates) {
      if (update.id === data.id || mergedUpdateIds.includes(update.id)) {
        continue;
      }

      ydoc.applyUpdate(update.data);
    }

    ydoc.applyUpdate(data.data);
    const revision = BigInt(data.revision);
    const updatesToDelete = [data.id, ...mergedUpdateIds];

    if (document) {
      const { updatedDocument } = await this.workspace.database
        .transaction()
        .execute(async (trx) => {
          const updatedDocument = await trx
            .updateTable('documents')
            .returningAll()
            .set({
              state: ydoc.getState(),
              revision: revision,
              updated_at: data.createdAt,
              updated_by: data.createdBy,
            })
            .where('id', '=', data.documentId)
            .where('revision', '=', document.revision)
            .executeTakeFirst();

          if (!updatedDocument) {
            throw new Error('Failed to update document');
          }

          await trx
            .deleteFrom('document_updates')
            .where('id', 'in', updatesToDelete)
            .execute();

          return { updatedDocument };
        });

      if (!updatedDocument) {
        return false;
      }

      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentId: data.documentId,
      });
    } else {
      const { createdDocument } = await this.workspace.database
        .transaction()
        .execute(async (trx) => {
          const createdDocument = await trx
            .insertInto('documents')
            .returningAll()
            .values({
              id: data.documentId,
              state: ydoc.getState(),
              revision: revision,
              created_at: data.createdAt,
              created_by: data.createdBy,
            })
            .onConflict((cb) => cb.doNothing())
            .executeTakeFirst();

          if (!createdDocument) {
            throw new Error('Failed to create document');
          }

          await trx
            .deleteFrom('document_updates')
            .where('id', 'in', updatesToDelete)
            .execute();

          return { createdDocument };
        });

      if (!createdDocument) {
        return false;
      }

      eventBus.publish({
        type: 'document_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        documentId: data.documentId,
      });
    }

    return true;
  }
}
