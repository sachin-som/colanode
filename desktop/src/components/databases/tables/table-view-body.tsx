import React from 'react';
import { useDatabase } from '@/contexts/database';
import { TableViewRow } from '@/components/databases/tables/table-view-row';
import { TableViewEmptyPlaceholder } from '@/components/databases/tables/table-view-empty-placeholder';
import { TableViewLoadMoreRow } from '@/components/databases/tables/table-view-load-more-row';
import { useInfiniteQuery } from '@/hooks/use-infinite-query';
import { useViewSearch } from '@/contexts/view-search';
import { useWorkspace } from '@/contexts/workspace';

const RECORDS_PER_PAGE = 50;

export const TableViewBody = () => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const viewSearch = useViewSearch();

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageInput: {
        type: 'record_list',
        databaseId: database.id,
        filters: viewSearch.filters,
        sorts: viewSearch.sorts,
        page: 0,
        count: RECORDS_PER_PAGE,
        userId: workspace.userId,
      },
      getNextPageInput(page, pages) {
        if (page > pages.length) {
          return undefined;
        }

        const lastPage = pages[page - 1];
        if (lastPage.length < RECORDS_PER_PAGE) {
          return undefined;
        }

        return {
          type: 'record_list',
          databaseId: database.id,
          filters: viewSearch.filters,
          sorts: viewSearch.sorts,
          page: page,
          count: RECORDS_PER_PAGE,
          userId: workspace.userId,
        };
      },
    });

  const records = data?.flatMap((page) => page) ?? [];
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
