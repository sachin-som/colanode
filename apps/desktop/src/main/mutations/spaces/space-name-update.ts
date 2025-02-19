import { SpaceAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SpaceNameUpdateMutationInput,
  SpaceNameUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-name-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class SpaceNameUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceNameUpdateMutationInput>
{
  async handleMutation(
    input: SpaceNameUpdateMutationInput
  ): Promise<SpaceNameUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.name = input.name;
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.SpaceUpdateForbidden,
        "You don't have permission to update this space."
      );
    }

    return {
      success: true,
    };
  }
}
