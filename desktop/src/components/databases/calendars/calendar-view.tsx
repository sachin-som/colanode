import React from 'react';
import { CalendarViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/contexts/database';
import { CalendarViewGrid } from '@/components/databases/calendars/calendar-view-grid';
import { ViewSortsAndFilters } from '@/components/databases/view-sorts-and-filters';
import { ViewSortButton } from '@/components/databases/sorts/view-sort-button';
import { ViewFilterButton } from '@/components/databases/filters/view-filter.button';

interface CalendarViewProps {
  node: CalendarViewNode;
}

export const CalendarView = ({ node }: CalendarViewProps) => {
  const database = useDatabase();

  const [openSortsAndFilters, setOpenSortsAndFilters] = React.useState(true);

  const groupByField = database.fields.find(
    (field) => field.id === node.groupBy,
  );

  if (!groupByField) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <ViewSortButton
            viewId={node.id}
            sorts={node.sorts}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
          <ViewFilterButton
            viewId={node.id}
            filters={node.filters}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
        </div>
      </div>
      {openSortsAndFilters && (
        <ViewSortsAndFilters
          viewId={node.id}
          filters={node.filters}
          sorts={node.sorts}
        />
      )}
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <CalendarViewGrid view={node} field={groupByField} />
      </div>
    </React.Fragment>
  );
};
