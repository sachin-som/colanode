import { MutationHandler } from '@/main/lib/types';
import {
  ViewDeleteMutationInput,
  ViewDeleteMutationOutput,
} from '@/shared/mutations/databases/view-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class ViewDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<ViewDeleteMutationInput>
{
  async handleMutation(
    input: ViewDeleteMutationInput
  ): Promise<ViewDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.viewId);

    return {
      id: input.viewId,
    };
  }
}
