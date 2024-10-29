import { MutationHandler, MutationResult } from '@/operations/mutations';
import { SpaceUpdateMutationInput } from '@/operations/mutations/space-update';
import { updateNodeAtomically } from '@/main/utils';

export class SpaceUpdateMutationHandler
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput,
  ): Promise<MutationResult<SpaceUpdateMutationInput>> {
    const result = await updateNodeAtomically(
      input.userId,
      input.id,
      (attributesMap) => {
        if (input.name !== attributesMap.get('name')) {
          attributesMap.set('name', input.name);
        }

        if (input.description !== attributesMap.get('description')) {
          attributesMap.set('description', input.description);
        }

        if (input.avatar !== attributesMap.get('avatar')) {
          attributesMap.set('avatar', input.avatar);
        }
      },
    );

    if (!result) {
      return {
        output: {
          success: false,
        },
      };
    }

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
