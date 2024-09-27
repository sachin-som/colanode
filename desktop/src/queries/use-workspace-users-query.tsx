import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { LocalNode } from '@/types/nodes';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { QueryResult } from 'kysely';

const USERS_PER_PAGE = 50;

export const useWorkspaceUsersQuery = () => {
  const workspace = useWorkspace();

  return useInfiniteQuery<
    QueryResult<SelectNode>,
    Error,
    LocalNode[],
    string[],
    number
  >({
    queryKey: ['workspace', 'users', workspace.id],
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: QueryResult<SelectNode>,
      pages,
    ): number | undefined => {
      if (lastPage && lastPage.rows) {
        const userCount = lastPage.rows.length;

        if (userCount >= USERS_PER_PAGE) {
          return pages.length;
        }
      }
      return undefined;
    },
    queryFn: async ({ queryKey, pageParam }) => {
      const offset = pageParam * USERS_PER_PAGE;
      const query = workspace.schema
        .selectFrom('nodes')
        .selectAll()
        .where('type', '=', NodeTypes.User)
        .orderBy('created_at asc')
        .offset(offset)
        .limit(USERS_PER_PAGE)
        .compile();

      return await workspace.queryAndSubscribe({
        key: queryKey,
        page: pageParam,
        query,
      });
    },
    select: (data: InfiniteData<QueryResult<SelectNode>>): LocalNode[] => {
      const pages = data?.pages ?? [];
      const rows = pages.map((page) => page.rows).flat();
      return rows.map(mapNode);
    },
  });
};
