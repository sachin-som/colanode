import { interactionService } from '@/main/services/interaction-service';
import { MutationHandler } from '@/main/types';
import {
  MarkNodeAsOpenedMutationInput,
  MarkNodeAsOpenedMutationOutput,
} from '@/shared/mutations/interactions/mark-node-as-opened';

export class MarkNodeAsOpenedMutationHandler
  implements MutationHandler<MarkNodeAsOpenedMutationInput>
{
  async handleMutation(
    input: MarkNodeAsOpenedMutationInput
  ): Promise<MarkNodeAsOpenedMutationOutput> {
    await interactionService.setInteraction(input.userId, input.nodeId, [
      {
        attribute: 'firstSeenAt',
        value: new Date().toISOString(),
      },
      {
        attribute: 'lastSeenAt',
        value: new Date().toISOString(),
      },
      {
        attribute: 'lastSeenTransactionId',
        value: input.transactionId,
      },
      {
        attribute: 'lastOpenedAt',
        value: new Date().toISOString(),
      },
      {
        attribute: 'lastOpenedTransactionId',
        value: input.transactionId,
      },
    ]);

    return {
      success: true,
    };
  }
}
