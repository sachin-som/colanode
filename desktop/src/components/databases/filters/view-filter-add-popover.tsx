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
import { ViewFilterNode } from '@/types/databases';
import { getFieldFilterOperators, getFieldIcon } from '@/lib/databases';
import { useViewFilterCreateMutation } from '@/mutations/use-view-filter-create-mutation';

interface ViewFilterAddPopoverProps {
  viewId: string;
  existingFilters: ViewFilterNode[];
  children: React.ReactNode;
  onCreate?: () => void;
}

export const ViewFilterAddPopover = ({
  viewId,
  existingFilters,
  children,
  onCreate,
}: ViewFilterAddPopoverProps) => {
  const database = useDatabase();
  const { mutate, isPending } = useViewFilterCreateMutation();

  const [open, setOpen] = React.useState(false);
  const fieldsWithoutFilters = database.fields.filter(
    (field) => !existingFilters.some((filter) => filter.fieldId === field.id),
  );

  if (fieldsWithoutFilters.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <Command className="min-h-min">
          <CommandInput placeholder="Search fields..." className="h-9" />
          <CommandEmpty>No field found.</CommandEmpty>
          <CommandList>
            <CommandGroup className="h-min max-h-96">
              {fieldsWithoutFilters.map((field) => (
                <CommandItem
                  key={field.id}
                  onSelect={() => {
                    if (isPending) {
                      return;
                    }

                    const operators = getFieldFilterOperators(field.dataType);
                    mutate(
                      {
                        viewId,
                        fieldId: field.id,
                        operator: operators[0].value,
                      },
                      {
                        onSuccess: (data) => {
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
