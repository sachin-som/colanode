import React from 'react';
import { getSelectOptionLightColorClass } from '@/lib/databases';
import { cn } from '@/lib/utils';
import {
  BoardViewNode,
  SelectFieldNode,
  SelectOptionNode,
} from '@/types/databases';
import { useDrop } from 'react-dnd';
import { BoardViewColumnHeader } from '@/renderer/components/databases/boards/board-view-column-header';
import { BoardViewColumnRecords } from '@/renderer/components/databases/boards/board-view-column-records';

interface BoardViewColumnProps {
  view: BoardViewNode;
  field: SelectFieldNode;
  option: SelectOptionNode;
}

export const BoardViewColumn = ({
  view,
  field,
  option,
}: BoardViewColumnProps) => {
  const [{ isDragging }, drop] = useDrop({
    accept: 'board-record',
    drop: () => ({
      option: option,
      field: field,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isOver(),
    }),
  });

  const divRef = React.useRef<HTMLDivElement>(null);
  const dropRef = drop(divRef);

  const lightClass = getSelectOptionLightColorClass(option.color ?? 'gray');
  return (
    <div
      ref={dropRef as any}
      className={cn('min-h-[400px] border-r p-1', isDragging && lightClass)}
      style={{
        minWidth: '250px',
        maxWidth: '250px',
        width: '250px',
      }}
    >
      <BoardViewColumnHeader option={option} />
      <BoardViewColumnRecords view={view} field={field} option={option} />
    </div>
  );
};
