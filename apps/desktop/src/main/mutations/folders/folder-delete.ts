import { MutationHandler } from '@/main/lib/types';
import {
  FolderDeleteMutationInput,
  FolderDeleteMutationOutput,
} from '@/shared/mutations/folders/folder-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FolderDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FolderDeleteMutationInput>
{
  async handleMutation(
    input: FolderDeleteMutationInput
  ): Promise<FolderDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    await workspace.nodes.deleteNode(input.folderId);

    return {
      success: true,
    };
  }
}
