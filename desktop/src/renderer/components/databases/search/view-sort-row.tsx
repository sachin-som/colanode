import React from 'react';
import { FieldNode, ViewSort } from '@/types/databases';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Button } from '@/renderer/components/ui/button';
import { SortDirections } from '@/lib/constants';
import { useViewSearch } from '@/renderer/contexts/view-search';
import { FieldIcon } from '../fields/field-icon';
import { ChevronDown, Trash2 } from 'lucide-react';

interface ViewSortProps {
  sort: ViewSort;
  field: FieldNode;
}

export const ViewSortRow = ({ sort, field }: ViewSortProps) => {
  const viewSearch = useViewSearch();

  return (
    <div className="flex flex-row items-center gap-3 text-sm">
      <div className="flex flex-row items-center gap-0.5 p-1">
        <FieldIcon type={field.dataType} className="size-4" />
        <p>{field.name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex flex-grow flex-row items-center gap-1 rounded-md p-1 font-semibold hover:cursor-pointer hover:bg-gray-100">
            <p>
              {sort.direction === SortDirections.Ascending
                ? 'Ascending'
                : 'Descending'}
            </p>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              viewSearch.updateSort(sort.id, {
                ...sort,
                direction: 'asc',
              });
            }}
          >
            <p>Ascending</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              viewSearch.updateSort(sort.id, {
                ...sort,
                direction: 'desc',
              });
            }}
          >
            <p>Descending</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          viewSearch.removeSort(sort.id);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
};
