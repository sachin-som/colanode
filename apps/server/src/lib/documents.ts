import {
  CanUpdateDocumentContext,
  createDebugger,
  DocumentContent,
  getNodeModel,
  UpdateDocumentMutationData,
} from '@colanode/core';
import { decodeState, YDoc } from '@colanode/crdt';

import { database } from '@/data/database';
import { SelectUser } from '@/data/schema';
import { ConcurrentUpdateResult, UpdateDocumentOutput } from '@/types/nodes';
import { eventBus } from '@/lib/event-bus';
import { fetchNodeTree, mapNode } from '@/lib/nodes';
import { jobService } from '@/services/job-service';
import { configuration } from './configuration';

const debug = createDebugger('server:lib:documents');

const UPDATE_RETRIES_LIMIT = 10;

export const updateDocumentFromMutation = async (
  user: SelectUser,
  mutation: UpdateDocumentMutationData
): Promise<UpdateDocumentOutput | null> => {
  for (let count = 0; count < UPDATE_RETRIES_LIMIT; count++) {
    const result = await tryUpdateDocumentFromMutation(user, mutation);

    if (result.type === 'success') {
      return result.output;
    }

    if (result.type === 'error') {
      return null;
    }
  }

  return null;
};

const tryUpdateDocumentFromMutation = async (
  user: SelectUser,
  mutation: UpdateDocumentMutationData
): Promise<ConcurrentUpdateResult<UpdateDocumentOutput>> => {
  const tree = await fetchNodeTree(mutation.documentId);
  if (!tree) {
    return { type: 'error', output: null };
  }

  const node = tree[tree.length - 1];
  if (!node) {
    return { type: 'error', output: null };
  }

  const model = getNodeModel(node.type);
  if (!model.documentSchema) {
    return { type: 'error', output: null };
  }

  const context: CanUpdateDocumentContext = {
    user: {
      id: user.id,
      role: user.role,
      workspaceId: user.workspace_id,
      accountId: user.account_id,
    },
    node: mapNode(node),
    tree: tree.map((node) => mapNode(node)),
  };

  if (!model.canUpdateDocument(context)) {
    return { type: 'error', output: null };
  }

  const document = await database
    .selectFrom('documents')
    .where('id', '=', mutation.documentId)
    .selectAll()
    .executeTakeFirst();

  const documentUpdates = await database
    .selectFrom('document_updates')
    .where('document_id', '=', mutation.documentId)
    .selectAll()
    .execute();

  const ydoc = new YDoc();
  for (const update of documentUpdates) {
    ydoc.applyUpdate(update.data);
  }

  ydoc.applyUpdate(mutation.data);
  const content = ydoc.getObject<DocumentContent>();

  if (!model.documentSchema.safeParse(content).success) {
    return { type: 'error', output: null };
  }

  try {
    const { updatedDocument, createdDocumentUpdate } = await database
      .transaction()
      .execute(async (trx) => {
        if (document) {
          const createdDocumentUpdate = await trx
            .insertInto('document_updates')
            .returningAll()
            .values({
              id: mutation.updateId,
              document_id: mutation.documentId,
              workspace_id: user.workspace_id,
              root_id: node.root_id,
              data: decodeState(mutation.data),
              created_at: new Date(mutation.createdAt),
              created_by: user.id,
              merged_updates: null,
            })
            .executeTakeFirst();

          if (!createdDocumentUpdate) {
            throw new Error('Failed to create document update');
          }

          const updatedDocument = await trx
            .updateTable('documents')
            .returningAll()
            .set({
              content: JSON.stringify(content),
              updated_at: new Date(mutation.createdAt),
              updated_by: user.id,
              revision: createdDocumentUpdate.revision,
            })
            .where('id', '=', mutation.documentId)
            .where('revision', '=', document.revision)
            .executeTakeFirst();

          if (!updatedDocument) {
            throw new Error('Failed to update document');
          }

          return { updatedDocument, createdDocumentUpdate };
        }

        const createdDocumentUpdate = await trx
          .insertInto('document_updates')
          .returningAll()
          .values({
            id: mutation.updateId,
            document_id: mutation.documentId,
            root_id: node.root_id,
            workspace_id: user.workspace_id,
            data: decodeState(mutation.data),
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
            merged_updates: null,
          })
          .executeTakeFirst();

        if (!createdDocumentUpdate) {
          throw new Error('Failed to create document update');
        }

        const updatedDocument = await trx
          .insertInto('documents')
          .returningAll()
          .values({
            id: mutation.documentId,
            workspace_id: user.workspace_id,
            content: JSON.stringify(content),
            created_at: new Date(mutation.createdAt),
            created_by: user.id,
            revision: createdDocumentUpdate.revision,
          })
          .onConflict((cb) => cb.doNothing())
          .executeTakeFirst();

        if (!updatedDocument) {
          throw new Error('Failed to create document');
        }

        return { updatedDocument, createdDocumentUpdate };
      });

    if (!updatedDocument || !createdDocumentUpdate) {
      throw new Error('Failed to update document');
    }

    eventBus.publish({
      type: 'document_updated',
      documentId: mutation.documentId,
      workspaceId: user.workspace_id,
    });

    eventBus.publish({
      type: 'document_update_created',
      documentId: mutation.documentId,
      rootId: node.root_id,
      workspaceId: user.workspace_id,
    });

    await scheduleDocumentEmbedding(mutation.documentId);

    return {
      type: 'success',
      output: {
        update: createdDocumentUpdate,
      },
    };
  } catch (error) {
    debug(`Failed to update document: ${error}`);
    return { type: 'retry', output: null };
  }
};

async function scheduleDocumentEmbedding(documentId: string) {
  await jobService.addJob(
    {
      type: 'embed_document',
      documentId,
    },
    {
      jobId: `embed_document:${documentId}`,
      delay: configuration.ai.embedDelay,
    }
  );
}
