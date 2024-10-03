import { databaseContext } from '@/main/data/database-context';
import { NeuronId } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeAttributeDeleteMutationInput } from '@/types/mutations/node-attribute-delete';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeAttributeDeleteMutationHandler
  implements MutationHandler<NodeAttributeDeleteMutationInput>
{
  async handleMutation(
    input: NodeAttributeDeleteMutationInput,
  ): Promise<MutationResult<NodeAttributeDeleteMutationInput>> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.nodeId)
      .selectAll()
      .executeTakeFirst();

    if (!node) {
      throw new Error('Node not found');
    }

    const doc = new Y.Doc({
      guid: node.id,
    });

    Y.applyUpdate(doc, toUint8Array(node.state));

    const attributesMap = doc.getMap('attributes');
    if (!attributesMap.has(input.attribute)) {
      return {
        output: {
          success: true,
        },
      };
    }

    attributesMap.delete(input.attribute);
    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        state: encodedState,
        attributes: attributes,
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
        version_id: NeuronId.generate(NeuronId.Type.Version),
      })
      .where('id', '=', input.nodeId)
      .execute();

    return {
      output: {
        success: true,
      },
      changedTables: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: input.userId,
        },
      ],
    };
  }
}
