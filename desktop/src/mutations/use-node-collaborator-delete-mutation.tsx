import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';

interface NodeCollaboratorDeleteInput {
  nodeId: string;
  collaboratorId: string;
}

export const useNodeCollaboratorDeleteMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeCollaboratorDeleteInput) => {
      const mutation = workspace.schema
        .deleteFrom('node_permissions')
        .where((eb) =>
          eb.and([
            eb('node_id', '=', input.nodeId),
            eb('collaborator_id', '=', input.collaboratorId),
          ]),
        )
        .compile();

      await workspace.mutate(mutation);
    },
  });
};
