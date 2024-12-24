import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  DatabaseDeleteMutationInput,
  DatabaseDeleteMutationOutput,
} from '@/shared/mutations/databases/database-delete';

export class DatabaseDeleteMutationHandler
  implements MutationHandler<DatabaseDeleteMutationInput>
{
  async handleMutation(
    input: DatabaseDeleteMutationInput
  ): Promise<DatabaseDeleteMutationOutput> {
    await entryService.deleteEntry(input.databaseId, input.userId);

    return {
      success: true,
    };
  }
}
