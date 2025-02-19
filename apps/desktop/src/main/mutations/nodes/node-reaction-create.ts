import { MutationHandler } from '@/main/lib/types';
import {
  NodeReactionCreateMutationInput,
  NodeReactionCreateMutationOutput,
} from '@/shared/mutations/nodes/node-reaction-create';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class NodeReactionCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<NodeReactionCreateMutationInput>
{
  async handleMutation(
    input: NodeReactionCreateMutationInput
  ): Promise<NodeReactionCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    await workspace.nodeReactions.createNodeReaction(
      input.nodeId,
      input.reaction
    );

    return {
      success: true,
    };
  }
}
