import { databaseService } from '@/main/data/database-service';
import { socketManager } from '@/main/sockets/socket-manager';
import { MutationChange, MutationHandler, MutationResult } from '@/main/types';
import { ServerNodeDeleteMutationInput } from '@/operations/mutations/server-node-delete';

export class ServerNodeDeleteMutationHandler
  implements MutationHandler<ServerNodeDeleteMutationInput>
{
  public async handleMutation(
    input: ServerNodeDeleteMutationInput
  ): Promise<MutationResult<ServerNodeDeleteMutationInput>> {
    const changes: MutationChange[] = [];

    const workspace = await databaseService.appDatabase
      .selectFrom('workspaces')
      .selectAll()
      .where((eb) =>
        eb.and([
          eb('account_id', '=', input.accountId),
          eb('workspace_id', '=', input.workspaceId),
        ])
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
      await databaseService.getWorkspaceDatabase(userId);

    await workspaceDatabase
      .deleteFrom('nodes')
      .where('id', '=', input.id)
      .execute();

    changes.push({
      type: 'workspace',
      table: 'nodes',
      userId: userId,
    });

    socketManager.sendMessage(workspace.account_id, {
      type: 'local_node_delete',
      nodeId: input.id,
      workspaceId: input.workspaceId,
    });

    return {
      output: {
        success: true,
      },
      changes: changes,
    };
  }
}
