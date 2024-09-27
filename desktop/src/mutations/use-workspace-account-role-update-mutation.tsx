import { useAxios } from '@/contexts/axios';
import { useWorkspace } from '@/contexts/workspace';
import { WorkspaceAccountRoleUpdateOutput } from '@/types/workspaces';
import { useMutation } from '@tanstack/react-query';

interface UpdateWorkspaceAccountRoleInput {
  accountId: string;
  role: number;
}

export const useWorkspaceAccountRoleUpdateMutation = () => {
  const workspace = useWorkspace();
  const axios = useAxios();

  return useMutation({
    mutationFn: async (input: UpdateWorkspaceAccountRoleInput) => {
      const { data } = await axios.put<WorkspaceAccountRoleUpdateOutput>(
        `v1/workspaces/${workspace.id}/accounts/${input.accountId}`,
        {
          role: input.role,
        },
      );

      const query = workspace.schema
        .updateTable('nodes')
        .set({
          attributes: JSON.stringify(data.user.attributes),
          updated_at: data.user.updatedAt,
          updated_by: data.user.updatedBy,
          version_id: data.user.versionId,
          server_updated_at: data.user.updatedAt,
          server_version_id: data.user.versionId,
        })
        .where('id', '=', data.user.id)
        .compile();

      await workspace.mutate(query);
    },
  });
};
