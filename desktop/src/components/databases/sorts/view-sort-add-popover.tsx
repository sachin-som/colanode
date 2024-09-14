import React from 'react';
import { Icon } from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDatabase } from '@/contexts/database';
import { getFieldIcon, isSortableField } from '@/lib/databases';
import { useViewSortCreateMutation } from '@/mutations/use-view-sort-create-mutation';
import { SortDirections } from '@/lib/constants';
import { ViewSortNode } from '@/types/databases';

interface ViewSortAddPopoverProps {
  viewId: string;
  existingSorts: ViewSortNode[];
  children: React.ReactNode;
  onCreate?: () => void;
}

export const ViewSortAddPopover = ({
  viewId,
  existingSorts,
  onCreate,
  children,
}: ViewSortAddPopoverProps) => {
  const database = useDatabase();
  const { mutate, isPending } = useViewSortCreateMutation();

  const [open, setOpen] = React.useState(false);
  const sortableFields = database.fields.filter(
    (field) =>
      isSortableField(field) &&
      !existingSorts.some((sort) => sort.fieldId === field.id),
  );

  if (sortableFields.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search fields..." className="h-9" />
          <CommandEmpty>No sortable field found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {sortableFields.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    if (isPending) {
                      return;
                    }

                    mutate(
                      {
                        viewId,
                        fieldId: field.id,
                        direction: SortDirections.Ascending,
                      },
                      {
                        onSuccess: () => {
                          onCreate?.();
                          setOpen(false);
                        },
                      },
                    );
                  }}
                >
                  <div className="flex w-full flex-row items-center gap-2">
                    <Icon name={getFieldIcon(field.dataType)} />
                    <p>{field.name}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
