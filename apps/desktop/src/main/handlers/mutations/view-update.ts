import { MutationHandler, MutationResult } from '@/main/types';
import { nodeManager } from '@/main/node-manager';
import { ViewUpdateMutationInput } from '@/operations/mutations/view-update';

export class ViewUpdateMutationHandler
  implements MutationHandler<ViewUpdateMutationInput>
{
  async handleMutation(
    input: ViewUpdateMutationInput
  ): Promise<MutationResult<ViewUpdateMutationInput>> {
    await nodeManager.updateNode(
      input.userId,
      input.databaseId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        attributes.views[input.view.id] = input.view;
        return attributes;
      }
    );

    return {
      output: {
        id: input.view.id,
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
