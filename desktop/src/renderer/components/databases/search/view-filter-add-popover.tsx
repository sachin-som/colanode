import React from 'react';
import { Icon } from '@/renderer/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import { useDatabase } from '@/renderer/contexts/database';
import { getFieldIcon } from '@/lib/databases';
import { useViewSearch } from '@/renderer/contexts/view-search';

interface ViewFilterAddPopoverProps {
  children: React.ReactNode;
}

export const ViewFilterAddPopover = ({
  children,
}: ViewFilterAddPopoverProps) => {
  const database = useDatabase();
  const viewSearch = useViewSearch();

  const [open, setOpen] = React.useState(false);
  const fieldsWithoutFilters = database.fields.filter(
    (field) =>
      !viewSearch.filters.some(
        (filter) => filter.type === 'field' && filter.fieldId === field.id,
      ),
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
                    viewSearch.initFieldFilter(field.id);
                    setOpen(false);
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
