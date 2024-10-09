import * as Y from 'yjs';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { mapNode } from '@/lib/nodes';
import { databaseManager } from '@/main/data/database-manager';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { DocumentSaveMutationInput } from '@/operations/mutations/document-save';
import { generateId, IdType } from '@/lib/id';

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

    const node = mapNode(document);
    const doc = new Y.Doc({
      guid: node.id,
    });

    Y.applyUpdate(doc, toUint8Array(node.state));
    const attributesMap = doc.getMap('attributes');
    attributesMap.set('content', input.content.content);

    const attributes = attributesMap.toJSON();
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const result = await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: JSON.stringify(attributes),
        state: encodedState,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: generateId(IdType.Version),
      })
      .where('id', '=', input.documentId)
      .execute();

    const hasChanges = result.length > 0 && result[0].numUpdatedRows > 0;
    const changes: MutationChange[] = hasChanges
      ? [
          {
            type: 'workspace',
            table: 'nodes',
            userId: input.userId,
          },
        ]
      : [];

    return {
      output: {
        success: true,
      },
      changes: changes,
    };
  }
}
