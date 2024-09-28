import axios from 'axios';
import { useAppDatabase } from '@/contexts/app-database';
import { ServerConfig } from '@/types/servers';
import { useMutation } from '@tanstack/react-query';

interface ServerCreateInput {
  domain: string;
}

export const useServerCreateMutation = () => {
  const appDatabase = useAppDatabase();

  return useMutation({
    mutationFn: async (input: ServerCreateInput) => {
      const { data } = await axios.get<ServerConfig>(
        `http://${input.domain}/v1/config`,
      );

      const query = appDatabase.database
        .insertInto('servers')
        .values({
          domain: input.domain,
          name: data.name,
          avatar: data.avatar,
          attributes: JSON.stringify(data.attributes),
          version: data.version,
          created_at: new Date().toISOString(),
        })
        .compile();

      await appDatabase.mutate(query);
    },
  });
};
