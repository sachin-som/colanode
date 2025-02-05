import { unset } from 'lodash-es';

import { MutationHandler } from '@/main/lib/types';
import {
  NodeCollaboratorDeleteMutationInput,
  NodeCollaboratorDeleteMutationOutput,
} from '@/shared/mutations/nodes/node-collaborator-delete';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class NodeCollaboratorDeleteMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeCollaboratorDeleteMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorDeleteMutationInput
  ): Promise<NodeCollaboratorDeleteMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode(
      input.nodeId,
      (attributes) => {
        unset(attributes, `collaborators.${input.collaboratorId}`);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorDeleteForbidden,
        "You don't have permission to remove collaborators from this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorDeleteFailed,
        'Something went wrong while removing collaborators from the node.'
      );
    }

    return {
      success: true,
    };
  }
}
