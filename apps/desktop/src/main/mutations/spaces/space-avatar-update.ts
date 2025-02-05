import { SpaceAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  SpaceAvatarUpdateMutationInput,
  SpaceAvatarUpdateMutationOutput,
} from '@/shared/mutations/spaces/space-avatar-update';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class SpaceAvatarUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceAvatarUpdateMutationInput>
{
  async handleMutation(
    input: SpaceAvatarUpdateMutationInput
  ): Promise<SpaceAvatarUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode<SpaceAttributes>(
      input.spaceId,
      (attributes) => {
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

    return {
      success: true,
    };
  }
}
