import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  RecordDeleteMutationInput,
  RecordDeleteMutationOutput,
} from '@/shared/mutations/records/record-delete';

export class RecordDeleteMutationHandler
  implements MutationHandler<RecordDeleteMutationInput>
{
  async handleMutation(
    input: RecordDeleteMutationInput
  ): Promise<RecordDeleteMutationOutput> {
    await entryService.deleteEntry(input.recordId, input.userId);

    return {
      success: true,
    };
  }
}
