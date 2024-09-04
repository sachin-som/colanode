import React from 'react';
import { useDatabase } from '@/contexts/database';
import { useWorkspace } from '@/contexts/workspace';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { TableViewRow } from '@/components/databases/tables/table-view-row';
import { TableViewEmptyPlaceholder } from '@/components/databases/tables/table-view-empty-placeholder';
import { QueryResult, sql } from 'kysely';
import { SelectNode } from '@/data/schemas/workspace';
import { buildRecords } from '@/lib/databases';
import { TableViewLoadMoreRow } from './table-view-load-more-row';

const RECORDS_PER_PAGE = 50;

export const TableViewBody = () => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ['table-body', database.id],
      initialPageParam: 0,
      getNextPageParam: (lastPage: QueryResult<SelectNode>, pages) => {
        if (lastPage && lastPage.rows) {
          const recordsCount = lastPage.rows.filter(
            (row) => row.type === NodeTypes.Record,
          ).length;

          if (recordsCount >= RECORDS_PER_PAGE) {
            return pages.length;
          }
        }
        return undefined;
      },
      queryFn: async ({ queryKey, pageParam }) => {
        const offset = pageParam * RECORDS_PER_PAGE;
        const query = sql<SelectNode>`
          WITH record_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${database.id} AND type = ${NodeTypes.Record}
            ORDER BY ${sql.ref('index')} ASC
            LIMIT ${sql.lit(RECORDS_PER_PAGE)}
            OFFSET ${sql.lit(offset)}
          ),
          author_nodes AS (
            SELECT *
            FROM nodes
            WHERE id IN (SELECT DISTINCT created_by FROM record_nodes)
          )
          SELECT * FROM record_nodes
          UNION ALL
          SELECT * FROM author_nodes;
        `.compile(workspace.schema);

        return await workspace.queryAndSubscribe({
          key: queryKey,
          page: pageParam,
          query,
        });
      },
    });

  const pages = data?.pages ?? [];
  const allNodes =
    pages
      .map((page) => page.rows)
      .flat()
      .map((row) => mapNode(row)) ?? [];

  const records = buildRecords(allNodes);
  return (
    <div className="border-t">
      {records.length === 0 && <TableViewEmptyPlaceholder />}
      {records.map((record, index) => (
        <TableViewRow key={record.id} index={index} record={record} />
      ))}
      {!isPending && hasNextPage && (
        <TableViewLoadMoreRow
          isPending={isFetchingNextPage}
          onClick={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        />
      )}
    </div>
  );
};
