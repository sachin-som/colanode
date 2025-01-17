import { DatabaseAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  DatabaseUpdateMutationInput,
  DatabaseUpdateMutationOutput,
} from '@/shared/mutations/databases/database-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class DatabaseUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DatabaseUpdateMutationInput>
{
  async handleMutation(
    input: DatabaseUpdateMutationInput
  ): Promise<DatabaseUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const result = await workspace.entries.updateEntry<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        attributes.name = input.name;

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
