import { set } from 'lodash-es';

import { MutationHandler } from '@/main/types';
import {
  EntryCollaboratorUpdateMutationInput,
  EntryCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/entries/entry-collaborator-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class EntryCollaboratorUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<EntryCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorUpdateMutationInput
  ): Promise<EntryCollaboratorUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry(
      input.entryId,
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
