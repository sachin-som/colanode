import { generateId, IdType } from '@colanode/core';
import { MutationHandler, MutationResult } from '@/main/types';
import { RecordCreateMutationInput } from '@/operations/mutations/record-create';
import { RecordAttributes } from '@colanode/core';
import { nodeService } from '@/main/services/node-service';

export class RecordCreateMutationHandler
  implements MutationHandler<RecordCreateMutationInput>
{
  async handleMutation(
    input: RecordCreateMutationInput
  ): Promise<MutationResult<RecordCreateMutationInput>> {
    const id = generateId(IdType.Record);
    const attributes: RecordAttributes = {
      type: 'record',
      parentId: input.databaseId,
      databaseId: input.databaseId,
      name: input.name ?? '',
      fields: {},
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
