import React from 'react';
import { CalendarViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/renderer/contexts/database';
import { CalendarViewGrid } from '@/components/databases/calendars/calendar-view-grid';
import { ViewSearchBar } from '@/components/databases/search/view-search-bar';
import { ViewSortButton } from '@/components/databases/search/view-sort-button';
import { ViewFilterButton } from '@/components/databases/search/view-filter-button';
import { ViewSearchProvider } from '@/components/databases/search/view-search-provider';

interface CalendarViewProps {
  node: CalendarViewNode;
}

export const CalendarView = ({ node }: CalendarViewProps) => {
  const database = useDatabase();

  const groupByField = database.fields.find(
    (field) => field.id === node.groupBy,
  );

  if (!groupByField) {
    return null;
  }

  return (
    <ViewSearchProvider id={node.id} filters={node.filters} sorts={node.sorts}>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <CalendarViewGrid view={node} field={groupByField} />
      </div>
    </ViewSearchProvider>
  );
};
