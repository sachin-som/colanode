import { MutationHandler } from '@/main/lib/types';
import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationOutput,
} from '@/shared/mutations/spaces/space-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class SpaceDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<SpaceDeleteMutationInput>
{
  async handleMutation(
    input: SpaceDeleteMutationInput
  ): Promise<SpaceDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.spaceId);

    return {
      success: true,
    };
  }
}
