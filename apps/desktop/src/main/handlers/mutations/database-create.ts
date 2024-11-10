import { generateId, IdType } from '@colanode/core';
import { generateNodeIndex } from '@/lib/nodes';
import { MutationHandler, MutationResult } from '@/main/types';
import { DatabaseCreateMutationInput } from '@/operations/mutations/database-create';
import { DatabaseAttributes } from '@colanode/core';
import { nodeManager } from '@/main/node-manager';

export class DatabaseCreateMutationHandler
  implements MutationHandler<DatabaseCreateMutationInput>
{
  async handleMutation(
    input: DatabaseCreateMutationInput
  ): Promise<MutationResult<DatabaseCreateMutationInput>> {
    const databaseId = generateId(IdType.Database);
    const viewId = generateId(IdType.View);
    const fieldId = generateId(IdType.Field);

    const attributes: DatabaseAttributes = {
      type: 'database',
      name: input.name,
      parentId: input.spaceId,
      fields: {
        [fieldId]: {
          id: fieldId,
          type: 'text',
          index: generateNodeIndex(null, null),
          name: 'Comment',
        },
      },
      views: {
        [viewId]: {
          id: viewId,
          type: 'table',
          name: 'Default',
          fields: {},
          filters: {},
          sorts: {},
          avatar: null,
          index: generateNodeIndex(null, null),
          groupBy: null,
        },
      },
    };

    await nodeManager.createNode(input.userId, {
      id: databaseId,
      attributes,
    });

    return {
      output: {
        id: databaseId,
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
