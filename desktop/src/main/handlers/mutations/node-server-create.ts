import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { NodeServerCreateMutationInput } from '@/operations/mutations/node-server-create';
import { toUint8Array } from 'js-base64';
import * as Y from 'yjs';

export class NodeServerCreateMutationHandler
  implements MutationHandler<NodeServerCreateMutationInput>
{
  public async handleMutation(
    input: NodeServerCreateMutationInput,
  ): Promise<MutationResult<NodeServerCreateMutationInput>> {
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
            server_version_id: input.versionId,
          })
          .where('version_id', '=', input.versionId),
      )
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
