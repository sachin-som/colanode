import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { DocumentSaveMutationInput } from '@/operations/mutations/document-save';
import { generateId, IdType } from '@/lib/id';
import { LocalUpdateNodeChangeData } from '@/types/sync';
import { applyChangeToYDoc, mapContentsToBlocks } from '@/lib/editor';
import { LocalNodeAttributes, NodeBlock } from '@/types/nodes';

export class DocumentSaveMutationHandler
  implements MutationHandler<DocumentSaveMutationInput>
{
  async handleMutation(
    input: DocumentSaveMutationInput,
  ): Promise<MutationResult<DocumentSaveMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const document = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();

    if (!document) {
      return {
        output: {
          success: false,
        },
        changes: [],
      };
    }

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updates: string[] = [];

    const doc = new Y.Doc({
      guid: document.id,
    });
    Y.applyUpdate(doc, toUint8Array(document.state));

    doc.on('update', (update) => {
      updates.push(fromUint8Array(update));
    });

    const attributes = JSON.parse(document.attributes) as LocalNodeAttributes;
    const blocksMap = new Map<string, NodeBlock>();
    if (attributes.content) {
      for (const [key, value] of Object.entries(attributes.content)) {
        blocksMap.set(key, value);
      }
    }

    const blocks = mapContentsToBlocks(
      document.id,
      input.content.content,
      blocksMap,
    );

    doc.transact(() => {
      applyChangeToYDoc(doc, blocks);
    });

    if (updates.length === 0) {
      return {
        output: {
          success: true,
        },
        changes: [],
      };
    }

    const attributesMap = doc.getMap('attributes');
    const attributesJson = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: document.id,
      updatedAt: updatedAt,
      updatedBy: input.userId,
      versionId: versionId,
      updates: updates,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .updateTable('nodes')
        .set({
          attributes: attributesJson,
          state: encodedState,
          updated_at: updatedAt,
          updated_by: input.userId,
          version_id: versionId,
        })
        .where('id', '=', input.documentId)
        .execute();

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: updatedAt,
        })
        .execute();
    });

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'changes',
          userId: input.userId,
        },
      ],
    };
  }
}
