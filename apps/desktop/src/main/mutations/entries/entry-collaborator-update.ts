import { set } from 'lodash-es';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorUpdateMutationInput,
  EntryCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/entries/entry-collaborator-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';

export class EntryCollaboratorUpdateMutationHandler
  implements MutationHandler<EntryCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorUpdateMutationInput
  ): Promise<EntryCollaboratorUpdateMutationOutput> {
    const result = await entryService.updateEntry(
      input.entryId,
      input.userId,
      (attributes) => {
        set(attributes, `collaborators.${input.collaboratorId}`, input.role);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorUpdateForbidden,
        "You don't have permission to update collaborators for this entry."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorUpdateFailed,
        'Something went wrong while updating collaborators for the entry.'
      );
    }

    return {
      success: true,
    };
  }
}
