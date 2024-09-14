import { Icon } from '@/components/ui/icon';
import { getFieldIcon } from '@/lib/databases';
import { FieldNode, ViewSortNode } from '@/types/databases';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeDeleteMutation } from '@/mutations/use-node-delete-mutation';
import { AttributeTypes, SortDirections } from '@/lib/constants';

interface ViewSortProps {
  sort: ViewSortNode;
  field: FieldNode;
}

export const ViewSort = ({ sort, field }: ViewSortProps) => {
  const { mutate: upsertAttribute } = useNodeAttributeUpsertMutation();
  const { mutate: deleteSort } = useNodeDeleteMutation();

  return (
    <div className="flex flex-row items-center gap-3 text-sm">
      <div className="flex flex-row items-center gap-0.5 p-1">
        <Icon name={getFieldIcon(field.dataType)} className="h-4 w-4" />
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
            <Icon
              name="arrow-down-s-line"
              className="h-4 w-4 text-muted-foreground"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => {
              upsertAttribute({
                nodeId: sort.id,
                type: AttributeTypes.Direction,
                key: '1',
                textValue: SortDirections.Ascending,
                numberValue: null,
                foreignNodeId: null,
              });
            }}
          >
            <p>Ascending</p>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              upsertAttribute({
                nodeId: sort.id,
                type: AttributeTypes.Direction,
                key: '1',
                textValue: SortDirections.Descending,
                numberValue: null,
                foreignNodeId: null,
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
          deleteSort(sort.id);
        }}
      >
        <Icon name="delete-bin-line" className="h-4 w-4" />
      </Button>
    </div>
  );
};
