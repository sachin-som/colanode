import React from 'react';
import { BooleanFieldNode, ViewFieldFilter } from '@/types/databases';
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
import { booleanFieldFilterOperators } from '@/lib/databases';
import { useViewSearch } from '@/renderer/contexts/view-search';
import { FieldIcon } from '../fields/field-icon';
import { ChevronDown, Trash2 } from 'lucide-react';

interface ViewBooleanFieldFilterProps {
  field: BooleanFieldNode;
  filter: ViewFieldFilter;
}

export const ViewBooleanFieldFilter = ({
  field,
  filter,
}: ViewBooleanFieldFilterProps) => {
  const viewSearch = useViewSearch();

  const operator =
    booleanFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? booleanFieldFilterOperators[0];

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
            <FieldIcon type={field.dataType} className="size-4" />
            <p>{field.name}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold hover:cursor-pointer hover:bg-gray-100">
                <p>{operator.label}</p>
                <ChevronDown className="size-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {booleanFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    viewSearch.updateFilter(filter.id, {
                      ...filter,
                      operator: operator.value,
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
            <Trash2 className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
