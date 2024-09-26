import { useAppDatabase } from '@/contexts/app-database';
import { useAxios } from '@/contexts/axios';
import { Workspace } from '@/types/workspaces';
import { useMutation } from '@tanstack/react-query';

interface CreateWorkspaceInput {
  name: string;
  description: string;
}

export const useWorkspaceCreateMutation = () => {
  const appDatabase = useAppDatabase();
  const axios = useAxios();

  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const { data } = await axios.post<Workspace>('v1/workspaces', input);
      const insertWorkspaceQuery = appDatabase.database
        .insertInto('workspaces')
        .values({
          id: data.id,
          account_id: data.accountId,
          name: data.name,
          description: data.description,
          avatar: data.avatar,
          role: data.role,
          synced: 0,
          user_id: data.userId,
          version_id: data.versionId,
        })
        .compile();

      await appDatabase.mutate(insertWorkspaceQuery);
    },
  });
};
