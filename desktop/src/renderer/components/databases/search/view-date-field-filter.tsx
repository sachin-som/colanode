import React from 'react';
import { DateFieldNode, ViewFieldFilter } from '@/types/databases';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Button } from '@/renderer/components/ui/button';
import { Icon } from '@/renderer/components/ui/icon';
import { getFieldIcon, dateFieldFilterOperators } from '@/lib/databases';
import { DatePicker } from '@/renderer/components/ui/date-picker';
import { useViewSearch } from '@/renderer/contexts/view-search';

interface ViewDateFieldFilterProps {
  field: DateFieldNode;
  filter: ViewFieldFilter;
}

export const ViewDateFieldFilter = ({
  field,
  filter,
}: ViewDateFieldFilterProps) => {
  const viewSearch = useViewSearch();

  const operator =
    dateFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? dateFieldFilterOperators[0];

  const dateTextValue = filter.value as string | null;
  const dateValue = dateTextValue ? new Date(dateTextValue) : null;

  const hideInput =
    operator.value === 'is_empty' || operator.value === 'is_not_empty';

  return (
    <Popover
      open={viewSearch.isFieldFilterOpened(filter.id)}
      onOpenChange={() => {
        if (viewSearch.isFieldFilterOpened(filter.id)) {
          viewSearch.closeFieldFilter(filter.id);
        } else {
          viewSearch.openFieldFilter(filter.id);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-dashed text-xs text-muted-foreground"
        >
          {field.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-96 flex-col gap-2 p-2">
        <div className="flex flex-row items-center gap-3 text-sm">
          <div className="flex flex-row items-center gap-0.5 p-1">
            <Icon name={getFieldIcon(field.dataType)} className="h-4 w-4" />
            <p>{field.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold hover:cursor-pointer hover:bg-gray-100">
                <p>{operator.label}</p>
                <Icon
                  name="arrow-down-s-line"
                  className="h-4 w-4 text-muted-foreground"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {dateFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? null
                        : dateValue?.toISOString();

                    viewSearch.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
                      value: value,
                    });
                  }}
                >
                  {operator.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              viewSearch.removeFilter(filter.id);
            }}
          >
            <Icon name="delete-bin-line" className="h-4 w-4" />
          </Button>
        </div>
        {!hideInput && (
          <DatePicker
            value={dateValue}
            onChange={(newValue) => {
              if (newValue === null || newValue === undefined) {
                viewSearch.updateFilter(filter.id, {
                  ...filter,
                  value: null,
                });
              } else {
                viewSearch.updateFilter(filter.id, {
                  ...filter,
                  value: newValue.toISOString(),
                });
              }
            }}
            placeholder="Select date"
            className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2 text-sm"
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
