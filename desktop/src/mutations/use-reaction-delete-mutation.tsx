import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

interface ReactionDeleteInput {
  nodeId: string;
  reaction: string;
}

export const useReactionDeleteMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: ReactionDeleteInput) => {
      const query = workspace.schema
        .deleteFrom('node_reactions')
        .where('node_id', '=', input.nodeId)
        .where('reactor_id', '=', workspace.userId)
        .where('reaction', '=', input.reaction)
        .compile();

      await workspace.mutate(query);
    },
  });
};
