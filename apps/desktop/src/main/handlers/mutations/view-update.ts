import { MutationHandler, MutationResult } from '@/main/types';
import { nodeService } from '@/main/services/node-service';
import { ViewUpdateMutationInput } from '@/operations/mutations/view-update';

export class ViewUpdateMutationHandler
  implements MutationHandler<ViewUpdateMutationInput>
{
  async handleMutation(
    input: ViewUpdateMutationInput
  ): Promise<MutationResult<ViewUpdateMutationInput>> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
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
