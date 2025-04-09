import { InView } from 'react-intersection-observer';

import { TableViewEmptyPlaceholder } from '@/renderer/components/databases/tables/table-view-empty-placeholder';
import { TableViewRow } from '@/renderer/components/databases/tables/table-view-row';
import { useDatabaseView } from '@/renderer/contexts/database-view';
import { useRecordsQuery } from '@/renderer/hooks/use-records-query';

export const TableViewBody = () => {
  const view = useDatabaseView();
  const { records, hasMore, loadMore, isPending } = useRecordsQuery(
    view.filters,
    view.sorts
  );

  return (
    <div className="border-t">
      {records.length === 0 && <TableViewEmptyPlaceholder />}
      {records.map((record, index) => (
        <TableViewRow key={record.id} index={index} record={record} />
      ))}
      <InView
        rootMargin="200px"
        onChange={(inView) => {
          if (inView && hasMore && !isPending) {
            loadMore();
          }
        }}
      ></InView>
    </div>
  );
};
