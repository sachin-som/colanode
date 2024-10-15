import { databaseManager } from '@/main/data/database-manager';
import { generateId, IdType } from '@/lib/id';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeCollaboratorCreateMutationInput } from '@/operations/mutations/node-collaborator-create';
import * as Y from 'yjs';
import { fromUint8Array } from 'js-base64';

export class NodeCollaboratorCreateMutationHandler
  implements MutationHandler<NodeCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorCreateMutationInput,
  ): Promise<MutationResult<NodeCollaboratorCreateMutationInput>> {
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

    const doc = new Y.Doc({
      guid: node.id,
    });

    const attributesMap = doc.getMap('attributes');

    doc.transact(() => {
      if (!attributesMap.has('collaborators')) {
        attributesMap.set('collaborators', new Y.Map());
      }

      const collaboratorsMap = attributesMap.get('collaborators') as Y.Map<any>;
      collaboratorsMap.set(input.userId, input.role);
    });

    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: attributes,
        state: encodedState,
        version_id: generateId(IdType.Version),
        updated_at: new Date().toISOString(),
        updated_by: input.userId,
      })
      .where('id', '=', node.id)
      .execute();

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
      ],
    };
  }
}
