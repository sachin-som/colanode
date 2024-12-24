import { set } from 'lodash-es';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorCreateMutationInput,
  EntryCollaboratorCreateMutationOutput,
} from '@/shared/mutations/collaborators/entry-collaborator-create';
import { MutationError } from '@/shared/mutations';

export class EntryCollaboratorCreateMutationHandler
  implements MutationHandler<EntryCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorCreateMutationInput
  ): Promise<EntryCollaboratorCreateMutationOutput> {
    const result = await entryService.updateEntry(
      input.entryId,
      input.userId,
      (attributes) => {
        for (const collaboratorId of input.collaboratorIds) {
          set(attributes, `collaborators.${collaboratorId}`, input.role);
        }
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        'unauthorized',
        "You don't have permission to add collaborators to this entry."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        'unknown',
        'Something went wrong while adding collaborators to the entry.'
      );
    }

    return {
      success: true,
    };
  }
}
