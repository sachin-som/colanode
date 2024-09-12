import React from 'react';
import { MultiSelectFieldNode, RecordNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';

const getMultiSelectValues = (
  record: RecordNode,
  field: MultiSelectFieldNode,
): string[] => {
  const attributes = record.attributes.filter((attr) => attr.type === field.id);
  return attributes.map((attr) => attr.foreignNodeId);
};

interface TableViewMultiSelectCellProps {
  record: RecordNode;
  field: MultiSelectFieldNode;
}

export const TableViewMultiSelectCell = ({
  record,
  field,
}: TableViewMultiSelectCellProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState(
    getMultiSelectValues(record, field),
  );

  React.useEffect(() => {
    setSelectedValues(getMultiSelectValues(record, field));
  }, [record.versionId]);

  const selectedOptions = field.options?.filter((option) =>
    selectedValues.includes(option.id),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-1">
          {selectedOptions?.map((option) => (
            <SelectOptionBadge
              key={option.id}
              name={option.name}
              color={option.color}
            />
          ))}
          {selectedOptions?.length === 0 && ' '}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={selectedValues}
          onSelect={(id) => {
            if (isPending) return;

            if (selectedValues.includes(id)) {
              setSelectedValues(selectedValues.filter((v) => v !== id));
              deleteNodeAttribute({
                nodeId: record.id,
                type: field.id,
                key: id,
              });
            } else {
              setSelectedValues([...selectedValues, id]);
              upsertNodeAttribute({
                nodeId: record.id,
                type: field.id,
                key: id,
                foreignNodeId: id,
                numberValue: null,
                textValue: null,
              });
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
