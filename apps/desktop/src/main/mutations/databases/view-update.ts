import { DatabaseAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ViewUpdateMutationInput,
  ViewUpdateMutationOutput,
} from '@/shared/mutations/databases/view-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class ViewUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewUpdateMutationInput>
{
  async handleMutation(
    input: ViewUpdateMutationInput
  ): Promise<ViewUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        if (!attributes.views[input.view.id]) {
          throw new MutationError(
            MutationErrorCode.ViewNotFound,
            'The view you are trying to update does not exist.'
          );
        }

        attributes.views[input.view.id] = input.view;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ViewUpdateForbidden,
        "You don't have permission to update this view."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.ViewUpdateFailed,
        'Something went wrong while updating the view.'
      );
    }

    return {
      id: input.view.id,
    };
  }
}
