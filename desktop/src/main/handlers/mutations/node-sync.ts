import { databaseManager } from '@/main/data/database-manager';
import { socketManager } from '@/main/sockets/socket-manager';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { NodeSyncMutationInput } from '@/operations/mutations/node-sync';
import { toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeSyncMutationHandler
  implements MutationHandler<NodeSyncMutationInput>
{
  public async handleMutation(
    input: NodeSyncMutationInput,
  ): Promise<MutationResult<NodeSyncMutationInput>> {
    const changes: MutationChange[] = [];

    for (const node of input.nodes) {
      const workspace = await databaseManager.appDatabase
        .selectFrom('workspaces')
        .selectAll()
        .where((eb) =>
          eb.and([
            eb('account_id', '=', input.accountId),
            eb('workspace_id', '=', node.workspaceId),
          ]),
        )
        .executeTakeFirst();

      if (!workspace) {
        continue;
      }

      const userId = workspace.user_id;
      const workspaceDatabase =
        await databaseManager.getWorkspaceDatabase(userId);

      if (node.deletedAt) {
        await workspaceDatabase
          .deleteFrom('nodes')
          .where('id', '=', node.id)
          .execute();

        continue;
      }

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
      } else {
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
            server_created_at: node.serverCreatedAt,
            server_updated_at: node.serverUpdatedAt,
            server_version_id: node.versionId,
            updated_at: node.updatedAt,
            updated_by: node.updatedBy,
            version_id: node.versionId,
          })
          .where('id', '=', node.id)
          .execute();
      }

      changes.push({
        type: 'workspace',
        table: 'nodes',
        userId: userId,
      });

      socketManager.sendMessage(workspace.account_id, {
        type: 'local_node_sync',
        nodeId: node.id,
        versionId: node.versionId,
      });
    }

    return {
      output: {
        success: true,
      },
      changes: changes,
    };
  }
}
