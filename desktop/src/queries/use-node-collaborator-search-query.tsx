import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { NodeCollaboratorNode } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { sha256 } from 'js-sha256';
import { QueryResult, sql } from 'kysely';

export const useNodeCollaboratorSearchQuery = (
  searchQuery: string,
  excluded: string[],
) => {
  const workspace = useWorkspace();
  const hash = sha256(`${searchQuery}-${excluded.sort().join(',')}`);
  return useQuery<
    QueryResult<SelectNode>,
    Error,
    NodeCollaboratorNode[],
    string[]
  >({
    queryKey: ['collaborator-search', hash],
    enabled: searchQuery.length > 0,
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
        SELECT n.*
        FROM nodes n
        JOIN node_names nn ON n.id = nn.id
        WHERE n.type = ${NodeTypes.User}
          AND nn.name MATCH ${searchQuery + '*'}
          ${
            excluded.length > 0
              ? sql`AND n.id NOT IN (${sql.join(
                  excluded.map((id) => sql`${id}`),
                  sql`, `,
                )})`
              : sql``
          }
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<SelectNode>): NodeCollaboratorNode[] => {
      const rows = data?.rows ?? [];
      return rows.map((row) => {
        const attributes = JSON.parse(row.attributes);
        return {
          id: row.id,
          name: attributes.name,
          email: attributes.email,
          avatar: attributes.avatar,
          role: 'collaborator',
        };
      });
    },
  });
};
