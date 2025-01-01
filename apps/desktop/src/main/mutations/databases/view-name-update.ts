import { DatabaseAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  ViewNameUpdateMutationInput,
  ViewNameUpdateMutationOutput,
} from '@/shared/mutations/databases/view-name-update';

export class ViewNameUpdateMutationHandler
  implements MutationHandler<ViewNameUpdateMutationInput>
{
  async handleMutation(
    input: ViewNameUpdateMutationInput
  ): Promise<ViewNameUpdateMutationOutput> {
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
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
