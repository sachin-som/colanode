import { useAxios } from '@/contexts/axios';
import { useWorkspace } from '@/contexts/workspace';
import { CreateNode } from '@/electron/schemas/workspace';
import { WorkspaceAccountsInviteOutput } from '@/types/workspaces';
import { useMutation } from '@tanstack/react-query';

interface InviteWorkspaceAccountsInput {
  emails: string[];
}

export const useWorkspaceAccountsInviteMutation = () => {
  const workspace = useWorkspace();
  const axios = useAxios();

  return useMutation({
    mutationFn: async (input: InviteWorkspaceAccountsInput) => {
      const { data } = await axios.post<WorkspaceAccountsInviteOutput>(
        `v1/workspaces/${workspace.id}/accounts`,
        input,
      );

      const usersToCreate: CreateNode[] = data.users.map((user) => {
        return {
          id: user.id,
          attributes: JSON.stringify(user.attributes),
          state: user.state,
          created_at: user.createdAt,
          created_by: user.createdBy,
          updated_at: user.updatedAt,
          updated_by: user.updatedBy,
          server_created_at: user.serverCreatedAt,
          server_updated_at: user.serverUpdatedAt,
          server_version_id: user.versionId,
          version_id: user.versionId,
        };
      });

      const query = workspace.schema
        .insertInto('nodes')
        .values(usersToCreate)
        .onConflict((cb) => cb.doNothing())
        .compile();

      await workspace.mutate(query);
    },
  });
};
