import React from 'react';
import { EmailFieldNode, ViewFieldFilter } from '@/types/databases';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { getFieldIcon, emailFieldFilterOperators } from '@/lib/databases';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useViewSearch } from '@/contexts/view-search';

interface ViewEmailFieldFilterProps {
  field: EmailFieldNode;
  filter: ViewFieldFilter;
}

export const ViewEmailFieldFilter = ({
  field,
  filter,
}: ViewEmailFieldFilterProps) => {
  const viewSearch = useViewSearch();

  const operator =
    emailFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? emailFieldFilterOperators[0];

  const textValue = filter.value as string | null;

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
              {emailFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    const value =
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                        ? null
                        : textValue;

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
          <SmartTextInput
            value={textValue}
            onChange={(value) => {
              viewSearch.updateFilter(filter.id, {
                ...filter,
                value: value,
              });
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
};
