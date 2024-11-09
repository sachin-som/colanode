import { generateId, IdType } from '@colanode/core';
import { MutationHandler, MutationResult } from '@/main/types';
import { ViewCreateMutationInput } from '@/operations/mutations/view-create';
import { compareString } from '@/lib/utils';
import { generateNodeIndex } from '@/lib/nodes';
import { nodeManager } from '@/main/node-manager';

export class ViewCreateMutationHandler
  implements MutationHandler<ViewCreateMutationInput>
{
  async handleMutation(
    input: ViewCreateMutationInput
  ): Promise<MutationResult<ViewCreateMutationInput>> {
    const id = generateId(IdType.View);
    await nodeManager.updateNode(
      input.userId,
      input.databaseId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        const maxIndex = Object.values(attributes.views)
          .map((view) => view.index)
          .sort((a, b) => -compareString(a, b))[0];

        attributes.views[id] = {
          id: id,
          type: input.viewType,
          name: input.name,
          avatar: null,
          fields: {},
          filters: {},
          sorts: {},
          groupBy: input.groupBy,
          index: generateNodeIndex(maxIndex, null),
        };

        return attributes;
      }
    );

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
      ],
    };
  }
}
