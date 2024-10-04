import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { NodeSyncMutationInput } from '@/types/mutations/node-sync';
import { ServerNode } from '@/types/nodes';
import { fromUint8Array, toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeSyncMutationHandler
  implements MutationHandler<NodeSyncMutationInput>
{
  public async handleMutation(
    input: NodeSyncMutationInput,
  ): Promise<MutationResult<NodeSyncMutationInput>> {
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
    if (input.action === 'insert' && input.after) {
      await this.insertNode(userId, input.after);
    } else if (input.action === 'update' && input.after) {
      await this.updateNode(userId, input.after);
    } else if (input.action === 'delete' && input.before) {
      await this.deleteNode(userId, input.before);
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

  private async insertNode(userId: string, node: ServerNode): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .insertInto('nodes')
      .values({
        id: node.id,
        attributes: JSON.stringify(node.attributes),
        state: node.state,
        created_at: node.createdAt,
        created_by: node.createdBy,
        updated_by: node.updatedBy,
        updated_at: node.updatedAt,
        version_id: node.versionId,
        server_created_at: node.serverCreatedAt,
        server_updated_at: node.serverUpdatedAt,
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
  }

  private async updateNode(userId: string, node: ServerNode): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    const existingNode = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', node.id)
      .executeTakeFirst();

    if (existingNode.version_id === node.versionId) {
      return;
    }

    const doc = new Y.Doc({
      guid: node.id,
    });

    Y.applyUpdate(doc, toUint8Array(existingNode.state));
    Y.applyUpdate(doc, toUint8Array(node.state));

    const attributesMap = doc.getMap('attributes');
    const attributes = JSON.stringify(attributesMap.toJSON());
    const encodedState = fromUint8Array(Y.encodeStateAsUpdate(doc));

    await workspaceDatabase
      .updateTable('nodes')
      .set({
        attributes: attributes,
        state: encodedState,
        updated_at: node.updatedAt,
        updated_by: node.updatedBy,
        version_id: node.versionId,
        server_created_at: node.serverCreatedAt,
        server_updated_at: node.serverUpdatedAt,
        server_version_id: node.versionId,
      })
      .where('id', '=', node.id)
      .execute();
  }

  private async deleteNode(userId: string, node: ServerNode): Promise<void> {
    const workspaceDatabase =
      await databaseManager.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .deleteFrom('nodes')
      .where('id', '=', node.id)
      .execute();
  }
}
