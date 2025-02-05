import {
  PageDeleteMutationInput,
  PageDeleteMutationOutput,
} from '@/shared/mutations/pages/page-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';
import { MutationHandler } from '@/main/lib/types';

export class PageDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<PageDeleteMutationInput>
{
  async handleMutation(
    input: PageDeleteMutationInput
  ): Promise<PageDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.pageId);

    return {
      success: true,
    };
  }
}
