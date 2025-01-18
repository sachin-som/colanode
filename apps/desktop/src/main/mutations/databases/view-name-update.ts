import { DatabaseAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ViewNameUpdateMutationInput,
  ViewNameUpdateMutationOutput,
} from '@/shared/mutations/databases/view-name-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class ViewNameUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewNameUpdateMutationInput>
{
  async handleMutation(
    input: ViewNameUpdateMutationInput
  ): Promise<ViewNameUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry<DatabaseAttributes>(
      input.databaseId,
      (attributes) => {
        const view = attributes.views[input.viewId];
        if (!view) {
          throw new MutationError(
            MutationErrorCode.ViewNotFound,
            'The view you are trying to update the name of does not exist.'
          );
        }

        view.name = input.name;
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
      id: input.viewId,
    };
  }
}
