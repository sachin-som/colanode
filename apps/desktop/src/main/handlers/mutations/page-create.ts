import { generateId, IdType } from '@colanode/core';
import { MutationHandler, MutationResult } from '@/main/types';
import { PageCreateMutationInput } from '@/operations/mutations/page-create';
import { PageAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class PageCreateMutationHandler
  implements MutationHandler<PageCreateMutationInput>
{
  async handleMutation(
    input: PageCreateMutationInput
  ): Promise<MutationResult<PageCreateMutationInput>> {
    const id = generateId(IdType.Page);
    const attributes: PageAttributes = {
      type: 'page',
      parentId: input.parentId,
      name: input.name,
      content: {},
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
