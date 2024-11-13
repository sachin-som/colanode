import { MutationHandler, MutationResult } from '@/main/types';
import { SpaceUpdateMutationInput } from '@/operations/mutations/space-update';
import { nodeService } from '@/main/services/node-service';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<MutationResult<SpaceUpdateMutationInput>> {
    await nodeService.updateNode(input.id, input.userId, (attributes) => {
      if (attributes.type !== 'space') {
        throw new Error('Node is not a space');
      }

      attributes.name = input.name;
      attributes.description = input.description;
      attributes.avatar = input.avatar;

      return attributes;
    });

    return {
      output: {
        success: true,
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
