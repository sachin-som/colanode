import { MutationHandler } from '@/main/lib/types';
import {
  DatabaseDeleteMutationInput,
  DatabaseDeleteMutationOutput,
} from '@/shared/mutations/databases/database-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class DatabaseDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<DatabaseDeleteMutationInput>
{
  async handleMutation(
    input: DatabaseDeleteMutationInput
  ): Promise<DatabaseDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodes.deleteNode(input.databaseId);

    return {
      success: true,
    };
  }
}
