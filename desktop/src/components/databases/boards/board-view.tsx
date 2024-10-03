import React from 'react';
import { BoardViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';
import { useDatabase } from '@/renderer/contexts/database';
import { BoardViewColumn } from '@/components/databases/boards/board-view-column';
import { ViewSearchBar } from '@/components/databases/search/view-search-bar';
import { ViewSortButton } from '@/components/databases/search/view-sort-button';
import { ViewFilterButton } from '@/components/databases/search/view-filter-button';
import { ViewSearchProvider } from '@/components/databases/search/view-search-provider';

interface BoardViewProps {
  node: BoardViewNode;
}

export const BoardView = ({ node }: BoardViewProps) => {
  const database = useDatabase();

  const groupByField = database.fields.find(
    (field) => field.id === node.groupBy,
  );

  if (!groupByField || groupByField.dataType !== 'select') {
    return null;
  }

  return (
    <ViewSearchProvider id={node.id} filters={node.filters} sorts={node.sorts}>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
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
    </ViewSearchProvider>
  );
};
