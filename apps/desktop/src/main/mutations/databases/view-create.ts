import {
  compareString,
  DatabaseAttributes,
  generateId,
  generateNodeIndex,
  IdType,
} from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  ViewCreateMutationInput,
  ViewCreateMutationOutput,
} from '@/shared/mutations/databases/view-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class ViewCreateMutationHandler
  implements MutationHandler<ViewCreateMutationInput>
{
  async handleMutation(
    input: ViewCreateMutationInput
  ): Promise<ViewCreateMutationOutput> {
    const id = generateId(IdType.View);
    const result = await entryService.updateEntry<DatabaseAttributes>(
      input.databaseId,
      input.userId,
      (attributes) => {
        const maxIndex = Object.values(attributes.views)
          .map((view) => view.index)
          .sort((a, b) => -compareString(a, b))[0];

        attributes.views[id] = {
          id: id,
          type: input.viewType,
          name: input.name,
          groupBy: input.groupBy,
          index: generateNodeIndex(maxIndex, null),
        };

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.ViewCreateForbidden,
        "You don't have permission to create a view in this database."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.ViewCreateFailed,
        'Something went wrong while creating the view.'
      );
    }

    return {
      id: id,
    };
  }
}
