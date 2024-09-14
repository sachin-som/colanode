import React from 'react';
import { useDatabase } from '@/contexts/database';
import { TableViewRow } from '@/components/databases/tables/table-view-row';
import { TableViewEmptyPlaceholder } from '@/components/databases/tables/table-view-empty-placeholder';
import { TableViewLoadMoreRow } from './table-view-load-more-row';
import { useRecordsQuery } from '@/queries/use-records-query';
import { useTableView } from '@/contexts/table-view';

export const TableViewBody = () => {
  const database = useDatabase();
  const tableView = useTableView();

  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useRecordsQuery(database.id, tableView.filters, tableView.sorts);

  const records = data ?? [];
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
