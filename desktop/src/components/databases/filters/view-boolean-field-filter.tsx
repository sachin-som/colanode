import React from 'react';
import { BooleanFieldNode, ViewFilterNode } from '@/types/databases';
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
import { getFieldIcon, booleanFieldFilterOperators } from '@/lib/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { AttributeTypes } from '@/lib/constants';
import { useNodeDeleteMutation } from '@/mutations/use-node-delete-mutation';

interface ViewBooleanFieldFilterProps {
  field: BooleanFieldNode;
  filter: ViewFilterNode;
}

export const ViewBooleanFieldFilter = ({
  field,
  filter,
}: ViewBooleanFieldFilterProps) => {
  const [open, setOpen] = React.useState(false);
  const { mutate: upsertAttribute } = useNodeAttributeUpsertMutation();
  const { mutate: deleteFilter } = useNodeDeleteMutation();

  const operator =
    booleanFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? booleanFieldFilterOperators[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              {booleanFieldFilterOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onSelect={() => {
                    upsertAttribute({
                      nodeId: filter.id,
                      type: AttributeTypes.Operator,
                      key: '1',
                      textValue: operator.value,
                      numberValue: null,
                      foreignNodeId: null,
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
              deleteFilter(filter.id);
            }}
          >
            <Icon name="delete-bin-line" className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
