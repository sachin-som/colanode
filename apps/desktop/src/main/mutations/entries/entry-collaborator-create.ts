import { set } from 'lodash-es';

import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorCreateMutationInput,
  EntryCollaboratorCreateMutationOutput,
} from '@/shared/mutations/entries/entry-collaborator-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class EntryCollaboratorCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<EntryCollaboratorCreateMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorCreateMutationInput
  ): Promise<EntryCollaboratorCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry(
      input.entryId,
      (attributes) => {
        for (const collaboratorId of input.collaboratorIds) {
          set(attributes, `collaborators.${collaboratorId}`, input.role);
        }
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorCreateForbidden,
        "You don't have permission to add collaborators to this entry."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.EntryCollaboratorCreateFailed,
        'Something went wrong while adding collaborators to the entry.'
      );
    }

    return {
      success: true,
    };
  }
}
