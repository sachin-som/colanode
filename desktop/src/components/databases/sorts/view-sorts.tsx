import React from 'react';
import { ViewSortNode } from '@/types/databases';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ViewSort } from '@/components/databases/sorts/view-sort';
import { useDatabase } from '@/contexts/database';
import { ViewSortAddPopover } from './view-sort-add-popover';
import { Icon } from '@/components/ui/icon';

interface ViewSortsProps {
  viewId: string;
  sorts: ViewSortNode[];
}

export const ViewSorts = ({ viewId, sorts }: ViewSortsProps) => {
  const database = useDatabase();
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          Sorts ({sorts.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-2 p-2">
        {sorts.map((sort) => {
          const field = database.fields.find(
            (field) => field.id === sort.fieldId,
          );

          if (!field) return null;
          return <ViewSort key={sort.id} sort={sort} field={field} />;
        })}
        <ViewSortAddPopover
          viewId={viewId}
          existingSorts={sorts}
          onCreate={() => setOpen(true)}
        >
          <button className="flex cursor-pointer flex-row items-center gap-1 rounded-lg p-1 text-sm text-muted-foreground hover:bg-gray-50">
            <Icon name="add-line" />
            Add sort
          </button>
        </ViewSortAddPopover>
      </PopoverContent>
    </Popover>
  );
};
