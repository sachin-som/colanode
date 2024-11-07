import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/main/types';
import { FileDownloadMutationInput } from '@/operations/mutations/file-download';

export class FileDownloadMutationHandler
  implements MutationHandler<FileDownloadMutationInput>
{
  async handleMutation(
    input: FileDownloadMutationInput
  ): Promise<MutationResult<FileDownloadMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const node = await workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.fileId)
      .executeTakeFirst();

    if (!node) {
      return {
        output: {
          success: false,
        },
      };
    }

    const download = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('node_id', '=', input.fileId)
      .executeTakeFirst();

    if (download) {
      return {
        output: {
          success: true,
        },
      };
    }

    await workspaceDatabase
      .insertInto('downloads')
      .values({
        node_id: input.fileId,
        created_at: new Date().toISOString(),
        progress: 0,
        retry_count: 0,
      })
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'workspace',
          table: 'downloads',
          userId: input.userId,
        },
      ],
    };
  }
}
