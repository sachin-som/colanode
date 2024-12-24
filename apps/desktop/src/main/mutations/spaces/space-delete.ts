import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationOutput,
} from '@/shared/mutations/spaces/space-delete';

export class SpaceDeleteMutationHandler
  implements MutationHandler<SpaceDeleteMutationInput>
{
  async handleMutation(
    input: SpaceDeleteMutationInput
  ): Promise<SpaceDeleteMutationOutput> {
    await entryService.deleteEntry(input.spaceId, input.userId);

    return {
      success: true,
    };
  }
}
