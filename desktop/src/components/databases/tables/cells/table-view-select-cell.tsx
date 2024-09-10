import React from 'react';
import { RecordNode, SelectFieldNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useUpdateSelectFieldValueMutation } from '@/mutations/use-update-select-field-value-mutation';

const getSelectValue = (
  record: RecordNode,
  field: SelectFieldNode,
): string | null => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.foreignNodeId ?? null;
};

interface TableViewSelectCellProps {
  record: RecordNode;
  field: SelectFieldNode;
}

export const TableViewSelectCell = ({
  record,
  field,
}: TableViewSelectCellProps) => {
  const { mutate, isPending } = useUpdateSelectFieldValueMutation();
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    getSelectValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setSelectedValue(getSelectValue(record, field) ?? '');
  }, [record.versionId]);

  const selectedOption = field.options?.find(
    (option) => option.id === selectedValue,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-full w-full cursor-pointer p-1">
          {selectedOption ? (
            <SelectOptionBadge
              name={selectedOption.name}
              color={selectedOption.color}
            />
          ) : (
            ' '
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={[selectedValue]}
          onSelect={(id) => {
            if (isPending) {
              return;
            }

            if (selectedValue === id) {
              setSelectedValue('');
              mutate({
                recordId: record.id,
                fieldId: field.id,
                selectOptionId: id,
                add: false,
              });
            } else {
              setSelectedValue(id);
              mutate(
                {
                  recordId: record.id,
                  fieldId: field.id,
                  selectOptionId: id,
                  add: true,
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                  },
                },
              );
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
