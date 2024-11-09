import { generateId, IdType } from '@colanode/core';
import { MutationHandler, MutationResult } from '@/main/types';
import { FolderCreateMutationInput } from '@/operations/mutations/folder-create';
import { FolderAttributes } from '@colanode/core';
import { nodeManager } from '@/main/node-manager';
import { databaseManager } from '@/main/data/database-manager';

export class FolderCreateMutationHandler
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput
  ): Promise<MutationResult<FolderCreateMutationInput>> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const attributes: FolderAttributes = {
      type: 'folder',
      parentId: input.parentId,
      name: input.name,
      collaborators: {},
    };

    const id = generateId(IdType.Folder);

    await workspaceDatabase.transaction().execute(async (trx) => {
      await nodeManager.createNode(trx, input.userId, id, attributes);
    });

    return {
      output: {
        id: id,
      },
      changes: [
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
      ],
    };
  }
}
