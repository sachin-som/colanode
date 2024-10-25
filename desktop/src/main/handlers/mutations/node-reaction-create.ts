import { generateId, IdType } from '@/lib/id';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeReactionCreateMutationInput } from '@/operations/mutations/node-reaction-create';
import { LocalUpdateNodeChangeData } from '@/types/sync';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeReactionCreateMutationHandler
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput,
  ): Promise<MutationResult<NodeReactionCreateMutationInput>> {
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

    doc.transact(() => {
      if (!attributesMap.has('reactions')) {
        attributesMap.set('reactions', new Y.Map());
      }

      const reactionsMap = attributesMap.get('reactions') as Y.Map<any>;
      if (!reactionsMap.has(input.reaction)) {
        reactionsMap.set(input.reaction, new Y.Array());
      }

      const reactionArray = reactionsMap.get(input.reaction) as Y.Array<string>;
      if (reactionArray.toArray().includes(input.userId)) {
        return;
      }

      reactionArray.push([input.userId]);
    });

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    if (encodedState === node.state) {
      return;
    }

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
