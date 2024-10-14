import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeBatchSyncMutationInput } from '@/operations/mutations/node-batch-sync';
import { toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeBatchSyncMutationHandler
  implements MutationHandler<NodeBatchSyncMutationInput>
{
  public async handleMutation(
    input: NodeBatchSyncMutationInput,
  ): Promise<MutationResult<NodeBatchSyncMutationInput>> {
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

    for (const node of input.nodes) {
      const existingNode = await workspaceDatabase
        .selectFrom('nodes')
        .where('id', '=', node.id)
        .selectAll()
        .executeTakeFirst();

      if (!existingNode) {
        const doc = new Y.Doc({
          guid: node.id,
        });

        Y.applyUpdate(doc, toUint8Array(node.state));

        const attributesMap = doc.getMap('attributes');
        const attributes = JSON.stringify(attributesMap.toJSON());

        await workspaceDatabase
          .insertInto('nodes')
          .values({
            id: node.id,
            attributes: attributes,
            state: node.state,
            created_at: node.createdAt,
            created_by: node.createdBy,
            version_id: node.versionId,
            server_created_at: node.serverCreatedAt,
            server_version_id: node.versionId,
          })
          .onConflict((cb) =>
            cb
              .doUpdateSet({
                server_created_at: node.serverCreatedAt,
                server_updated_at: node.serverUpdatedAt,
                server_version_id: node.versionId,
              })
              .where('version_id', '=', node.versionId),
          )
          .execute();
      } else if (existingNode.version_id !== node.versionId) {
        const doc = new Y.Doc({
          guid: node.id,
        });

        Y.applyUpdate(doc, toUint8Array(existingNode.state));
        Y.applyUpdate(doc, toUint8Array(node.state));

        const attributesMap = doc.getMap('attributes');
        const attributes = JSON.stringify(attributesMap.toJSON());

        await workspaceDatabase
          .updateTable('nodes')
          .set({
            state: node.state,
            attributes: attributes,
            server_updated_at: node.serverUpdatedAt,
            server_version_id: node.versionId,
            updated_at: node.updatedAt,
            updated_by: node.updatedBy,
            version_id: node.versionId,
          })
          .where('id', '=', node.id)
          .execute();
      }
    }

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
