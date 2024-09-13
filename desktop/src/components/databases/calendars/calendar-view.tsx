import React from 'react';
import { CalendarViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/contexts/database';
import { ViewActionButton } from '@/components/databases/view-action-button';
import { ViewFilters } from '@/components/databases/filters/view-filters';
import { CalendarViewGrid } from './calendar-view-grid';

interface CalendarViewProps {
  node: CalendarViewNode;
}

export const CalendarView = ({ node }: CalendarViewProps) => {
  const database = useDatabase();

  const [openFilters, setOpenFilters] = React.useState(true);
  const [openSort, setOpenSort] = React.useState(false);

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
          <ViewActionButton
            icon="sort-desc"
            onClick={() => setOpenSort((prev) => !prev)}
          />
          <ViewActionButton
            icon="filter-line"
            onClick={() => setOpenFilters((prev) => !prev)}
          />
        </div>
      </div>
      {openFilters && <ViewFilters viewId={node.id} filters={node.filters} />}
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <CalendarViewGrid view={node} field={groupByField} />
      </div>
    </React.Fragment>
  );
};
