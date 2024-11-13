import { MutationHandler, MutationResult } from '@/main/types';
import { NodeDeleteMutationInput } from '@/operations/mutations/node-delete';
import { nodeService } from '@/main/services/node-service';

export class NodeDeleteMutationHandler
  implements MutationHandler<NodeDeleteMutationInput>
{
  async handleMutation(
    input: NodeDeleteMutationInput
  ): Promise<MutationResult<NodeDeleteMutationInput>> {
    await nodeService.deleteNode(input.nodeId, input.userId);

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
        {
          type: 'workspace',
          table: 'uploads',
          userId: input.userId,
        },
        {
          type: 'workspace',
          table: 'downloads',
          userId: input.userId,
        },
      ],
    };
  }
}
