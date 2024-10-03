import React from 'react';
import { ViewNode } from '@/types/databases';
import { TableView } from '@/renderer/components/databases/tables/table-view';
import { BoardView } from '@/renderer/components/databases/boards/board-view';
import { CalendarView } from '@/renderer/components/databases/calendars/calendar-view';

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
