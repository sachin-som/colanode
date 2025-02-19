import { SpaceAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SpaceDescriptionUpdateMutationInput,
  SpaceDescriptionUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-description-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class SpaceDescriptionUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceDescriptionUpdateMutationInput>
{
  async handleMutation(
    input: SpaceDescriptionUpdateMutationInput
  ): Promise<SpaceDescriptionUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
        attributes.description = input.description;
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
