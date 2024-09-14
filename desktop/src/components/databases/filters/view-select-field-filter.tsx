import React from 'react';
import { SelectFieldNode, ViewFilterNode } from '@/types/databases';
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
import { getFieldIcon, selectFieldFilterOperators } from '@/lib/databases';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { AttributeTypes } from '@/lib/constants';
import { useNodeDeleteMutation } from '@/mutations/use-node-delete-mutation';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';

interface ViewSelectFieldFilterProps {
  field: SelectFieldNode;
  filter: ViewFilterNode;
}

export const ViewSelectFieldFilter = ({
  field,
  filter,
}: ViewSelectFieldFilterProps) => {
  const [open, setOpen] = React.useState(false);
  const { mutate: upsertAttribute } = useNodeAttributeUpsertMutation();
  const { mutate: deleteAttribute } = useNodeAttributeDeleteMutation();
  const { mutate: deleteFilter } = useNodeDeleteMutation();

  const operator =
    selectFieldFilterOperators.find(
      (operator) => operator.value === filter.operator,
    ) ?? selectFieldFilterOperators[0];

  const selectOptionIds = filter.values.map((value) => value.foreignNodeId);
  const selectedOptions = field.options.filter((option) =>
    selectOptionIds.includes(option.id),
  );

  const hideInput =
    operator.value === 'is_empty' || operator.value === 'is_not_empty';

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
              {selectFieldFilterOperators.map((operator) => (
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

                    if (
                      operator.value === 'is_empty' ||
                      operator.value === 'is_not_empty'
                    ) {
                      deleteAttribute({
                        nodeId: filter.id,
                        type: AttributeTypes.Value,
                        key: '1',
                      });
                    }
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
        {!hideInput && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex h-full w-full cursor-pointer flex-row items-center gap-1 rounded-md border border-input p-1">
                {selectedOptions.map((option) => (
                  <SelectOptionBadge
                    key={option.id}
                    name={option.name}
                    color={option.color}
                  />
                ))}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
              <SelectFieldOptions
                field={field}
                values={selectOptionIds}
                onSelect={(id) => {
                  if (selectOptionIds.includes(id)) {
                    deleteAttribute({
                      nodeId: filter.id,
                      type: AttributeTypes.Value,
                      key: id,
                    });
                  } else {
                    upsertAttribute({
                      nodeId: filter.id,
                      type: AttributeTypes.Value,
                      key: id,
                      foreignNodeId: id,
                      textValue: null,
                      numberValue: null,
                    });
                  }
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
