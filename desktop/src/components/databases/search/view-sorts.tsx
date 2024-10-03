import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ViewSortRow } from '@/components/databases/search/view-sort-row';
import { useDatabase } from '@/renderer/contexts/database';
import { ViewSortAddPopover } from '@/components/databases/search/view-sort-add-popover';
import { Icon } from '@/components/ui/icon';
import { useViewSearch } from '@/renderer/contexts/view-search';

export const ViewSorts = () => {
  const database = useDatabase();
  const viewSearch = useViewSearch();

  return (
    <Popover
      open={viewSearch.isSortsOpened}
      onOpenChange={(open) => {
        if (open) {
          viewSearch.openSorts();
        } else {
          viewSearch.closeSorts();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          Sorts ({viewSearch.sorts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2 p-2">
        {viewSearch.sorts.map((sort) => {
          const field = database.fields.find(
            (field) => field.id === sort.fieldId,
          );

          if (!field) return null;
          return <ViewSortRow key={sort.id} sort={sort} field={field} />;
        })}
        <ViewSortAddPopover>
          <button className="flex cursor-pointer flex-row items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground hover:bg-gray-50">
            <Icon name="add-line" />
            Add sort
          </button>
        </ViewSortAddPopover>
      </PopoverContent>
    </Popover>
  );
};
