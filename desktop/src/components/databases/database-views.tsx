import React from 'react';
import { LocalNode } from '@/types/nodes';
import { ViewTab } from '@/components/databases/view-tab';
import { ViewActions } from '@/components/databases/view-actions';
import { match } from 'ts-pattern';
import { NodeTypes } from '@/lib/constants';
import { TableView } from '@/components/databases/tables/table-view';
import { BoardView } from '@/components/databases/boards/board-view';
import { CalendarView } from '@/components/databases/calendars/calendar-view';

interface DatabaseViewsProps {
  views: LocalNode[];
}

export const DatabaseViews = ({ views }: DatabaseViewsProps) => {
  const [selectedView, setSelectedView] = React.useState<LocalNode | null>(
    views.length > 0 ? views[0] : null,
  );

  return (
    <div className="group/database">
      <div className="mt-2 flex flex-row justify-between border-b">
        <div className="flex flex-row gap-3">
          {views.map((view) => (
            <ViewTab
              key={view.id}
              view={view}
              isActive={view.id === selectedView?.id}
              onClick={() => setSelectedView(view)}
            />
          ))}
        </div>
        <ViewActions />
      </div>
      {match(selectedView?.type)
        .with(NodeTypes.TableView, () => <TableView node={selectedView} />)
        .with(NodeTypes.BoardView, () => <BoardView node={selectedView} />)
        .with(NodeTypes.CalendarView, () => (
          <CalendarView node={selectedView} />
        ))
        .otherwise(() => null)}
    </div>
  );
};
