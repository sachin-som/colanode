import { DatabaseAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '@/shared/mutations/databases/view-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class ViewDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<ViewDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        if (!attributes.views[input.viewId]) {
          throw new MutationError(
            MutationErrorCode.ViewNotFound,
            'The view you are trying to delete does not exist.'
          );
        }

        delete attributes.views[input.viewId];
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ViewDeleteForbidden,
        "You don't have permission to delete this view."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.ViewDeleteFailed,
        'Something went wrong while deleting the view.'
      );
    }

    return {
      id: input.viewId,
    };
  }
}
