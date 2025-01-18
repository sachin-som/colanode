import { unset } from 'lodash-es';

import { MutationHandler } from '@/main/lib/types';
import {
  EntryCollaboratorDeleteMutationInput,
  EntryCollaboratorDeleteMutationOutput,
} from '@/shared/mutations/entries/entry-collaborator-delete';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class EntryCollaboratorDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<EntryCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: EntryCollaboratorDeleteMutationInput
  ): Promise<EntryCollaboratorDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry(
      input.entryId,
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
