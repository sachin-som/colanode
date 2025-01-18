import { SpaceAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SpaceUpdateMutationInput,
  SpaceUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class SpaceUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceUpdateMutationInput>
{
  async handleMutation(
    input: SpaceUpdateMutationInput
  ): Promise<SpaceUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.entries.updateEntry<SpaceAttributes>(
      input.id,
      (attributes) => {
        attributes.name = input.name;
        attributes.description = input.description;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateForbidden,
        "You don't have permission to update this space."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateFailed,
        'Something went wrong while updating the space. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
