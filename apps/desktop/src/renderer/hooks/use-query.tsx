import { QueryInput } from '@/operations/queries';
import { sha256 } from 'js-sha256';
import { useQuery as useTanstackQuery } from '@tanstack/react-query';

export const useQuery = <T extends QueryInput>(input: T) => {
  const inputJson = JSON.stringify(input);
  const hash = sha256(inputJson);

  const { data, isPending } = useTanstackQuery({
    queryKey: [hash],
    queryFn: () => window.colanode.executeQueryAndSubscribe(hash, input),
  });

  return {
    isPending,
    data,
  };
};
