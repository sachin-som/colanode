import { MutationHandler, MutationResult } from '@/main/types';
import { nodeService } from '@/main/services/node-service';
import { ViewDeleteMutationInput } from '@/operations/mutations/view-delete';

export class ViewDeleteMutationHandler
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<MutationResult<ViewDeleteMutationInput>> {
    await nodeService.updateNode(
      input.databaseId,
      input.userId,
      (attributes) => {
        if (attributes.type !== 'database') {
          throw new Error('Node is not a database');
        }

        delete attributes.views[input.viewId];
        return attributes;
      }
    );

    return {
      output: {
        id: input.viewId,
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
