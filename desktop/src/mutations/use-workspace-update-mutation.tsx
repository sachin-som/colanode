import { useAppDatabase } from '@/contexts/app-database';
import { useAxios } from '@/contexts/axios';
import { Workspace } from '@/types/workspaces';
import { useMutation } from '@tanstack/react-query';

interface UpdateWorkspaceInput {
  id: string;
  name: string;
  description: string;
}

export const useWorkspaceUpdateMutation = () => {
  const appDatabase = useAppDatabase();
  const axios = useAxios();

  return useMutation({
    mutationFn: async (input: UpdateWorkspaceInput) => {
      const { data } = await axios.put<Workspace>(`v1/workspaces/${input.id}`, {
        name: input.name,
        description: input.description,
      });
      const updateWorkspaceQuery = appDatabase.database
        .updateTable('workspaces')
        .set({
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.role,
          version_id: data.versionId,
        })
        .compile();

      await appDatabase.mutate(updateWorkspaceQuery);
    },
  });
};
