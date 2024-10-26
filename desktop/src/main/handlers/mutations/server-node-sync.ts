import { databaseManager } from '@/main/data/database-manager';
import { socketManager } from '@/main/sockets/socket-manager';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { ServerNodeSyncMutationInput } from '@/operations/mutations/server-node-sync';
import { toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class ServerNodeSyncMutationHandler
  implements MutationHandler<ServerNodeSyncMutationInput>
{
  public async handleMutation(
    input: ServerNodeSyncMutationInput,
  ): Promise<MutationResult<ServerNodeSyncMutationInput>> {
    const changes: MutationChange[] = [];

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

    const existingNode = await workspaceDatabase
      .selectFrom('nodes')
      .where('id', '=', input.id)
      .selectAll()
      .executeTakeFirst();

    if (!existingNode) {
      const doc = new Y.Doc({
        guid: input.id,
      });

      Y.applyUpdate(doc, toUint8Array(input.state));

      const attributesMap = doc.getMap('attributes');
      const attributes = JSON.stringify(attributesMap.toJSON());

      await workspaceDatabase
        .insertInto('nodes')
        .values({
          id: input.id,
          attributes: attributes,
          state: input.state,
          created_at: input.createdAt,
          created_by: input.createdBy,
          version_id: input.versionId,
          server_created_at: input.serverCreatedAt,
          server_version_id: input.versionId,
        })
        .onConflict((cb) =>
          cb
            .doUpdateSet({
              server_created_at: input.serverCreatedAt,
              server_updated_at: input.serverUpdatedAt,
              server_version_id: input.versionId,
            })
            .where('version_id', '=', input.versionId),
        )
        .execute();
    } else {
      const doc = new Y.Doc({
        guid: input.id,
      });

      Y.applyUpdate(doc, toUint8Array(existingNode.state));
      Y.applyUpdate(doc, toUint8Array(input.state));

      const attributesMap = doc.getMap('attributes');
      const attributes = JSON.stringify(attributesMap.toJSON());

      await workspaceDatabase
        .updateTable('nodes')
        .set({
          state: input.state,
          attributes: attributes,
          server_created_at: input.serverCreatedAt,
          server_updated_at: input.serverUpdatedAt,
          server_version_id: input.versionId,
          updated_at: input.updatedAt,
          updated_by: input.updatedBy,
          version_id: input.versionId,
        })
        .where('id', '=', input.id)
        .execute();
    }

    changes.push({
      type: 'workspace',
      table: 'nodes',
      userId: userId,
    });

    socketManager.sendMessage(workspace.account_id, {
      type: 'local_node_sync',
      nodeId: input.id,
      versionId: input.versionId,
    });

    return {
      output: {
        success: true,
      },
      changes: changes,
    };
  }
}
