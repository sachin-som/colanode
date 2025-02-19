import { set } from 'lodash-es';

import { MutationHandler } from '@/main/lib/types';
import {
  NodeCollaboratorUpdateMutationInput,
  NodeCollaboratorUpdateMutationOutput,
} from '@/shared/mutations/nodes/node-collaborator-update';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class NodeCollaboratorUpdateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeCollaboratorUpdateMutationInput>
{
  async handleMutation(
    input: NodeCollaboratorUpdateMutationInput
  ): Promise<NodeCollaboratorUpdateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const result = await workspace.nodes.updateNode(
      input.nodeId,
      (attributes) => {
        set(attributes, `collaborators.${input.collaboratorId}`, input.role);
        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorUpdateForbidden,
        "You don't have permission to update collaborators for this node."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.NodeCollaboratorUpdateFailed,
        'Something went wrong while updating collaborators for the node.'
      );
    }

    return {
      success: true,
    };
  }
}
