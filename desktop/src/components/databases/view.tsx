import React from 'react';
import { ViewNode } from '@/types/databases';
import { TableView } from '@/components/databases/tables/table-view';
import { BoardView } from '@/components/databases/boards/board-view';
import { CalendarView } from '@/components/databases/calendars/calendar-view';

interface ViewProps {
  node: ViewNode;
}

export const View = ({ node }: ViewProps) => {
  if (node.type === 'table_view') {
    return <TableView node={node} />;
  }

  if (node.type === 'board_view') {
    return <BoardView node={node} />;
  }

  if (node.type === 'calendar_view') {
    return <CalendarView node={node} />;
  }

  return null;
};
