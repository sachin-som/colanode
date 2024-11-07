import { useDatabase } from '@/renderer/contexts/database';
import { useInfiniteQuery } from '@/renderer/hooks/use-infinite-query';
import {
  SelectFieldAttributes,
  SelectOptionAttributes,
  ViewFilterAttributes,
} from '@colanode/core';
import { BoardViewCard } from '@/renderer/components/databases/boards/board-view-card';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useView } from '@/renderer/contexts/view';

const RECORDS_PER_PAGE = 50;

interface BoardViewColumnRecordsProps {
  field: SelectFieldAttributes;
  option: SelectOptionAttributes;
}

export const BoardViewColumnRecords = ({
  field,
  option,
}: BoardViewColumnRecordsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();
  const view = useView();

  const filters: ViewFilterAttributes[] = [
    ...view.filters,
    {
      id: '1',
      type: 'field',
      fieldId: field.id,
      operator: 'is_in',
      value: [option.id],
    },
  ];
  const { data } = useInfiniteQuery({
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
        sorts: Object.values(view.sorts),
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
