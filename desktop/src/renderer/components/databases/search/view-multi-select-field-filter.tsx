import React from 'react';
import { MultiSelectFieldNode, ViewFieldFilter } from '@/types/databases';
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
import { getFieldIcon, selectFieldFilterOperators } from '@/lib/databases';
import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import { useViewSearch } from '@/renderer/contexts/view-search';

interface ViewMultiSelectFieldFilterProps {
  field: MultiSelectFieldNode;
  filter: ViewFieldFilter;
}

export const ViewMultiSelectFieldFilter = ({
  field,
  filter,
}: ViewMultiSelectFieldFilterProps) => {
  const viewSearch = useViewSearch();

  const operator =
    selectFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? selectFieldFilterOperators[0];

  const selectOptionIds = (filter.value as string[]) ?? [];
  const selectedOptions = field.options.filter((option) =>
    selectOptionIds.includes(option.id),
  );

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
              {selectFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? []
                        : selectOptionIds;

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
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-2">
                {selectedOptions.map((option) => (
                  <SelectOptionBadge
                    key={option.id}
                    name={option.name}
                    color={option.color}
                  />
                ))}
                {selectedOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No options selected
                  </p>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
              <SelectFieldOptions
                field={field}
                values={selectOptionIds}
                onSelect={(id) => {
                  const values = selectOptionIds.includes(id)
                    ? selectOptionIds.filter((value) => value !== id)
                    : [...selectOptionIds, id];

                  viewSearch.updateFilter(filter.id, {
                    ...filter,
                    value: values,
                  });
                }}
                allowAdd={false}
              />
            </PopoverContent>
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  );
};
