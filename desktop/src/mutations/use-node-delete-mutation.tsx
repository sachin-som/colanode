import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

export const useNodeDeleteMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (nodeId: string) => {
      const mutation = workspace.schema
        .deleteFrom('nodes')
        .where('id', '=', nodeId)
        .compile();

      await workspace.mutate(mutation);
    },
  });
};
