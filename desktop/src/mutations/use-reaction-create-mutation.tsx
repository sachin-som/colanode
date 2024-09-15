import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

interface ReactionCreateInput {
  nodeId: string;
  reaction: string;
}

export const useReactionCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: ReactionCreateInput) => {
      const query = workspace.schema
        .insertInto('node_reactions')
        .values({
          node_id: input.nodeId,
          reactor_id: workspace.userId,
          reaction: input.reaction,
          created_at: new Date().toISOString(),
        })
        .onConflict((b) => b.doNothing())
        .compile();

      await workspace.mutate(query);
    },
  });
};
