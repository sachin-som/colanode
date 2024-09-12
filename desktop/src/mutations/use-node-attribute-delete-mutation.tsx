import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

interface NodeAttributeDeleteInput {
  nodeId: string;
  type: string;
  key: string;
}

export const useNodeAttributeDeleteMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeAttributeDeleteInput) => {
      const query = workspace.schema
        .deleteFrom('node_attributes')
        .where((eb) =>
          eb.and([
            eb('node_id', '=', input.nodeId),
            eb('type', '=', input.type),
            eb('key', '=', input.key),
          ]),
        )
        .compile();

      await workspace.mutate(query);
    },
  });
};
