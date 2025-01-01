import { DatabaseAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  DatabaseUpdateMutationInput,
  DatabaseUpdateMutationOutput,
} from '@/shared/mutations/databases/database-update';

export class DatabaseUpdateMutationHandler
  implements MutationHandler<DatabaseUpdateMutationInput>
{
  async handleMutation(
    input: DatabaseUpdateMutationInput
  ): Promise<DatabaseUpdateMutationOutput> {
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.DatabaseUpdateForbidden,
        "You don't have permission to update this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.DatabaseUpdateFailed,
        'Something went wrong while updating the database.'
      );
    }

    return {
      success: true,
    };
  }
}
