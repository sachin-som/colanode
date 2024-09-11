import React from 'react';
import { CalendarViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';

interface CalendarViewProps {
  node: CalendarViewNode;
}

export const CalendarView = ({ node }: CalendarViewProps) => {
  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
      </div>
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        calendar view {node.id}
      </div>
    </React.Fragment>
  );
};
