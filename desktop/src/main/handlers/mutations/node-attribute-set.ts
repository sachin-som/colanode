import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeAttributeSetMutationInput } from '@/operations/mutations/node-attribute-set';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';
import { LocalUpdateNodeChangeData } from '@/types/sync';

export class NodeAttributeSetMutationHandler
  implements MutationHandler<NodeAttributeSetMutationInput>
{
  async handleMutation(
    input: NodeAttributeSetMutationInput,
  ): Promise<MutationResult<NodeAttributeSetMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.nodeId)
      .selectAll()
      .executeTakeFirst();

    if (!node) {
      throw new Error('Node not found');
    }

    const versionId = generateId(IdType.Version);
    const updatedAt = new Date().toISOString();
    const updates: string[] = [];

    const doc = new Y.Doc({
      guid: node.id,
    });
    Y.applyUpdate(doc, toUint8Array(node.state));

    doc.on('update', (update) => {
      updates.push(fromUint8Array(update));
    });

    const attributesMap = doc.getMap('attributes');
    attributesMap.set(input.attribute, input.value);

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    const changeData: LocalUpdateNodeChangeData = {
      type: 'node_update',
      id: node.id,
      updatedAt: updatedAt,
      updatedBy: input.userId,
      versionId: versionId,
      updates: updates,
    };

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .updateTable('nodes')
        .set({
          attributes: attributes,
          state: encodedState,
          updated_at: updatedAt,
          updated_by: input.userId,
          version_id: versionId,
        })
        .where('id', '=', input.nodeId)
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
