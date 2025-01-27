import { MutationHandler } from '@/main/lib/types';
import {
  WorkspaceMetadataDeleteMutationInput,
  WorkspaceMetadataDeleteMutationOutput,
} from '@/shared/mutations/workspaces/workspace-metadata-delete';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';
import { eventBus } from '@/shared/lib/event-bus';
import { mapWorkspaceMetadata } from '@/main/lib/mappers';

export class WorkspaceMetadataDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<WorkspaceMetadataDeleteMutationInput>
{
  async handleMutation(
    input: WorkspaceMetadataDeleteMutationInput
  ): Promise<WorkspaceMetadataDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const deletedMetadata = await workspace.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'workspace_metadata_deleted',
      accountId: input.accountId,
      workspaceId: input.workspaceId,
      metadata: mapWorkspaceMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
