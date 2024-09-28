import { useWorkspace } from '@/contexts/workspace';
import { CreateNodePermission } from '@/electron/schemas/workspace';
import { NeuronId } from '@/lib/id';
import { useMutation } from '@tanstack/react-query';

interface ReactionCreateInput {
  nodeId: string;
  collaboratorIds: string[];
  permission: string;
}

export const useNodeCollaboratorCreateMutation = () => {
  const workspace = useWorkspace();

  return useMutation({
    mutationFn: async (input: ReactionCreateInput) => {
      if (input.collaboratorIds.length === 0) {
        return;
      }

      const nodePermissionToCreate: CreateNodePermission[] =
        input.collaboratorIds.map((collaboratorId) => {
          return {
            node_id: input.nodeId,
            collaborator_id: collaboratorId,
            permission: input.permission,
            created_at: new Date().toISOString(),
            created_by: workspace.userId,
            version_id: NeuronId.generate(NeuronId.Type.Version),
          };
        });

      const query = workspace.schema
        .insertInto('node_permissions')
        .values(nodePermissionToCreate)
        .onConflict((b) => b.doNothing())
        .compile();

      await workspace.mutate(query);
    },
  });
};
