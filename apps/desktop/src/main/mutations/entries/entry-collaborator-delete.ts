import { unset } from 'lodash-es';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorDeleteMutationInput,
  EntryCollaboratorDeleteMutationOutput,
} from '@/shared/mutations/entries/entry-collaborator-delete';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class EntryCollaboratorDeleteMutationHandler
  implements MutationHandler<EntryCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorDeleteMutationInput
  ): Promise<EntryCollaboratorDeleteMutationOutput> {
    const result = await entryService.updateEntry(
      input.entryId,
      input.userId,
      (attributes) => {
        unset(attributes, `collaborators.${input.collaboratorId}`);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorDeleteForbidden,
        "You don't have permission to remove collaborators from this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorDeleteFailed,
        'Something went wrong while removing collaborators from the node.'
      );
    }

    return {
      success: true,
    };
  }
}
