import React from 'react';
import { useDatabase } from '@/contexts/database';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import {
  BoardViewNode,
  SelectFieldNode,
  SelectOptionNode,
  ViewFilter,
} from '@/types/databases';
import { BoardViewCard } from '@/components/databases/boards/board-view-card';
import { useWorkspace } from '@/contexts/workspace';

const RECORDS_PER_PAGE = 50;

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
  const workspace = useWorkspace();
  const database = useDatabase();

  const filters: ViewFilter[] = [
    ...view.filters,
    {
      id: '1',
      type: 'field',
      fieldId: field.id,
      operator: 'is_in',
      value: [option.id],
    },
  ];
  const { data, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      initialPageInput: {
        type: 'record_list',
        databaseId: database.id,
        filters: filters,
        sorts: view.sorts,
        page: 0,
        count: RECORDS_PER_PAGE,
        userId: workspace.userId,
      },
      getNextPageInput(page, pages) {
        if (page > pages.length) {
          return undefined;
        }

        const lastPage = pages[page - 1];
        if (lastPage.length < RECORDS_PER_PAGE) {
          return undefined;
        }

        return {
          type: 'record_list',
          databaseId: database.id,
          filters: filters,
          sorts: view.sorts,
          page: page,
          count: RECORDS_PER_PAGE,
          userId: workspace.userId,
        };
      },
    });

  const records = data?.flatMap((page) => page) ?? [];
  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record) => {
        return <BoardViewCard key={record.id} record={record} />;
      })}
    </div>
  );
};
