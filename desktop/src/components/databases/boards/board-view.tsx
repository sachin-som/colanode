import React from 'react';
import { BoardViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/contexts/database';
import { ViewActionButton } from '@/components/databases/view-action-button';
import { ViewFilters } from '@/components/databases/filters/view-filters';
import { BoardViewColumn } from '@/components/databases/boards/board-view-column';

interface BoardViewProps {
  node: BoardViewNode;
}

export const BoardView = ({ node }: BoardViewProps) => {
  const database = useDatabase();
  const [openFilters, setOpenFilters] = React.useState(true);
  const [openSort, setOpenSort] = React.useState(false);

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
          <ViewActionButton
            icon="sort-desc"
            onClick={() => setOpenSort((prev) => !prev)}
          />
          <ViewActionButton
            icon="filter-line"
            onClick={() => setOpenFilters((prev) => !prev)}
          />
        </div>
      </div>
      {openFilters && <ViewFilters viewId={node.id} filters={node.filters} />}
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
