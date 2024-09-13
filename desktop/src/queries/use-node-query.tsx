import { useWorkspace } from '@/contexts/workspace';
import { useQuery } from '@tanstack/react-query';

export const useNodeQuery = (nodeId: string) => {
  const workspace = useWorkspace();

  return useQuery({
    queryKey: ['node', nodeId],
    queryFn: async ({ queryKey }) => {
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', nodeId)
        .compile();

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
  });
};
