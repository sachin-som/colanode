import axios from 'axios';
import { useAppDatabase } from '@/contexts/app-database';
import { LoginOutput } from '@/types/accounts';
import { useMutation } from '@tanstack/react-query';
import { Server } from '@/types/servers';
import { buildLoginMutationQueries } from '@/lib/accounts';

interface EmailLoginInput {
  server: Server;
  email: string;
  password: string;
}

export const useEmailLoginMutation = () => {
  const appDatabase = useAppDatabase();

  return useMutation({
    mutationFn: async (input: EmailLoginInput) => {
      const { data } = await axios.post<LoginOutput>(
        `http://${input.server.domain}/v1/accounts/login/email`,
        {
          email: input.email,
          password: input.password,
        },
      );

      const queries = buildLoginMutationQueries(
        appDatabase.database,
        data,
        input.server,
      );

      await appDatabase.mutate(queries);
    },
  });
};
