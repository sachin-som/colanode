import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { UserNode } from '@/types/users';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useUserSearchQuery = (searchQuery: string) => {
  const workspace = useWorkspace();

  return useQuery<QueryResult<SelectNode>, Error, UserNode[], string[]>({
    queryKey: ['user-search', searchQuery],
    enabled: searchQuery.length > 0,
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        SELECT n.*
        FROM nodes n
        JOIN node_names nn ON n.id = nn.id
        WHERE n.type = ${NodeTypes.User}
          AND n.id != ${workspace.userId}
          AND nn.name MATCH ${searchQuery + '*'}
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): UserNode[] => {
      const rows = data?.rows ?? [];
      return rows.map((row) => {
        const attributes = JSON.parse(row.attributes);
        return {
          id: row.id,
          name: attributes.name,
          email: attributes.email,
          avatar: attributes.avatar,
        };
      });
    },
  });
};
