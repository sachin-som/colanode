import React from 'react';
import { useDatabase } from '@/contexts/database';
import { useRecordsQuery } from '@/queries/use-records-query';
import {
  BoardViewNode,
  SelectFieldNode,
  SelectOptionNode,
} from '@/types/databases';
import { BoardViewCard } from '@/components/databases/boards/board-view-card';

interface BoardViewColumnRecordsProps {
  view: BoardViewNode;
  field: SelectFieldNode;
  option: SelectOptionNode;
}

export const BoardViewColumnRecords = ({
  view,
  field,
  option,
}: BoardViewColumnRecordsProps) => {
  const database = useDatabase();

  const filters = [
    ...view.filters,
    {
      id: '1',
      fieldId: field.id,
      operator: 'is_in',
      values: [
        {
          textValue: null,
          numberValue: null,
          foreignNodeId: option.id,
        },
      ],
    },
  ];
  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useRecordsQuery(database.id, filters);

  const records = data ?? [];
  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record) => {
        return <BoardViewCard key={record.id} record={record} />;
      })}
    </div>
  );
};
