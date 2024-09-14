import React from 'react';
import { BoardViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/contexts/database';
import { BoardViewColumn } from '@/components/databases/boards/board-view-column';
import { ViewSortsAndFilters } from '@/components/databases/view-sorts-and-filters';
import { ViewSortButton } from '@/components/databases/sorts/view-sort-button';
import { ViewFilterButton } from '@/components/databases/filters/view-filter.button';

interface BoardViewProps {
  node: BoardViewNode;
}

export const BoardView = ({ node }: BoardViewProps) => {
  const database = useDatabase();
  const [openSortsAndFilters, setOpenSortsAndFilters] = React.useState(true);

  const groupByField = database.fields.find(
    (field) => field.id === node.groupBy,
  );

  if (!groupByField || groupByField.dataType !== 'select') {
    return null;
  }

  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <ViewSortButton
            viewId={node.id}
            sorts={node.sorts}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
          <ViewFilterButton
            viewId={node.id}
            filters={node.filters}
            open={openSortsAndFilters}
            setOpen={setOpenSortsAndFilters}
          />
        </div>
      </div>
      {openSortsAndFilters && (
        <ViewSortsAndFilters
          viewId={node.id}
          filters={node.filters}
          sorts={node.sorts}
        />
      )}
      <div className="mt-2 flex w-full min-w-full max-w-full flex-row gap-2 overflow-auto pr-5">
        {groupByField.options.map((option) => {
          return (
            <BoardViewColumn
              key={option.id}
              view={node}
              field={groupByField}
              option={option}
            />
          );
        })}
      </div>
    </React.Fragment>
  );
};
