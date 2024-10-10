import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeServerUpdateMutationInput } from '@/operations/mutations/node-server-update';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeServerUpdateMutationHandler
  implements MutationHandler<NodeServerUpdateMutationInput>
{
  public async handleMutation(
    input: NodeServerUpdateMutationInput,
  ): Promise<MutationResult<NodeServerUpdateMutationInput>> {
    const workspace = await databaseManager.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ]),
      )
      .executeTakeFirst();

    if (!workspace) {
      return {
        output: {
          success: false,
        },
      };
    }

    const userId = workspace.user_id;
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!node) {
      return {
        output: {
          success: false,
        },
      };
    }

    const doc = new Y.Doc({
      guid: input.id,
    });

    Y.applyUpdate(doc, toUint8Array(node.state));
    Y.applyUpdate(doc, toUint8Array(input.update));

    const attributesMap = doc.getMap('attributes');
    const attributes = JSON.stringify(attributesMap.toJSON());
    const state = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: attributes,
        state: state,
        updated_at: input.updatedAt,
        updated_by: input.updatedBy,
        version_id: input.versionId,
        server_version_id: input.versionId,
        server_updated_at: input.serverUpdatedAt,
      })
      .where('id', '=', input.id)
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'nodes',
          userId: userId,
        },
      ],
    };
  }
}
