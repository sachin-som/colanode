import { NodeTypes } from '@/lib/constants';
import { databaseManager } from '@/main/data/database-manager';
import { fileManager } from '@/main/file-manager';
import {
  MutationChange,
  MutationHandler,
  MutationResult,
} from '@/operations/mutations';
import { NodeDeleteMutationInput } from '@/operations/mutations/node-delete';
import { LocalDeleteNodeChangeData } from '@/types/sync';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput,
  ): Promise<MutationResult<NodeDeleteMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .select(['id', 'type', 'attributes'])
      .where('id', '=', input.nodeId)
      .executeTakeFirst();

    if (!node) {
      return {
        output: {
          success: false,
        },
      };
    }

    const changeData: LocalDeleteNodeChangeData = {
      type: 'node_delete',
      id: node.id,
      deletedAt: new Date().toISOString(),
      deletedBy: input.userId,
    };

    const isFile = node.type === NodeTypes.File;

    await workspaceDatabase.transaction().execute(async (trx) => {
      await trx
        .deleteFrom('user_nodes')
        .where('node_id', '=', input.nodeId)
        .execute();

      await trx.deleteFrom('nodes').where('id', '=', input.nodeId).execute();

      if (isFile) {
        await trx
          .deleteFrom('uploads')
          .where('node_id', '=', node.id)
          .execute();

        await trx
          .deleteFrom('downloads')
          .where('node_id', '=', node.id)
          .execute();
      }

      await trx
        .insertInto('changes')
        .values({
          data: JSON.stringify(changeData),
          created_at: new Date().toISOString(),
        })
        .execute();
    });

    const changes: MutationChange[] = [
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
    ];

    if (isFile) {
      const attributes = JSON.parse(node.attributes);
      fileManager.deleteFile(input.userId, node.id, attributes.extension);

      changes.push({
        type: 'workspace',
        table: 'uploads',
        userId: input.userId,
      });

      changes.push({
        type: 'workspace',
        table: 'downloads',
        userId: input.userId,
      });
    }

    return {
      output: {
        success: true,
      },
      changes,
    };
  }
}
