import React from 'react';
import { TextFieldNode, ViewFieldFilter } from '@/types/databases';
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
import { getFieldIcon, textFieldFilterOperators } from '@/lib/databases';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useViewSearch } from '@/renderer/contexts/view-search';

interface ViewTextFieldFilterProps {
  field: TextFieldNode;
  filter: ViewFieldFilter;
}

export const ViewTextFieldFilter = ({
  field,
  filter,
}: ViewTextFieldFilterProps) => {
  const viewSearch = useViewSearch();

  const operator =
    textFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? textFieldFilterOperators[0];

  const textValue = filter.value as string | null;

  const hideInput =
    operator.value === 'is_empty' || operator.value === 'is_not_empty';

  return (
    <Popover
      open={viewSearch.isFieldFilterOpened(filter.id)}
      onOpenChange={(open) => {
        if (open) {
          viewSearch.openFieldFilter(filter.id);
        } else {
          viewSearch.closeFieldFilter(filter.id);
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
              {textFieldFilterOperators.map((operator) => (
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
