import { QueryInput } from '@/shared/queries';
import { sha256 } from 'js-sha256';
import { useQueries as useTanstackQueries } from '@tanstack/react-query';

export const useQueries = <T extends QueryInput>(inputs: T[]) => {
  const result = useTanstackQueries({
    queries: inputs.map((input) => {
      const hash = sha256(JSON.stringify(input));
      return {
        queryKey: [hash],
        queryFn: () => window.colanode.executeQueryAndSubscribe(hash, input),
      };
    }),
  });

  return result;
};
