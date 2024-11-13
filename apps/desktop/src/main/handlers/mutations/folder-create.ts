import { generateId, IdType } from '@colanode/core';
import { MutationHandler, MutationResult } from '@/main/types';
import { FolderCreateMutationInput } from '@/operations/mutations/folder-create';
import { FolderAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class FolderCreateMutationHandler
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput
  ): Promise<MutationResult<FolderCreateMutationInput>> {
    const id = generateId(IdType.Folder);
    const attributes: FolderAttributes = {
      type: 'folder',
      parentId: input.parentId,
      name: input.name,
      collaborators: {},
    };

    await nodeService.createNode(input.userId, { id, attributes });

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
