import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface NodeCollaboratorUpdateInput {
  nodeId: string;
  collaboratorId: string;
  permission: string;
}

export const useNodeCollaboratorUpdateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: NodeCollaboratorUpdateInput) => {
      const mutation = workspace.schema
        .updateTable('node_permissions')
        .set({
          permission: input.permission,
          updated_at: new Date().toISOString(),
          updated_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
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
