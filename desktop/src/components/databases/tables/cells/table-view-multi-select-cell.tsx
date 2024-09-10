import React from 'react';
import { MultiSelectFieldNode, RecordNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useUpdateMultiSelectFieldValueMutation } from '@/mutations/use-update-multi-select-field-value-mutation';

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
  const { mutate, isPending } = useUpdateMultiSelectFieldValueMutation();
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
              mutate({
                recordId: record.id,
                fieldId: field.id,
                selectOptionId: id,
                add: false,
              });
            } else {
              setSelectedValues([...selectedValues, id]);
              mutate({
                recordId: record.id,
                fieldId: field.id,
                selectOptionId: id,
                add: true,
              });
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
