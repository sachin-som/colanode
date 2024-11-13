import React from 'react';
import { SelectFieldAttributes } from '@colanode/core';
import { SelectOptionBadge } from '@/renderer/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/renderer/components/ui/popover';
import { SelectFieldOptions } from '@/renderer/components/databases/fields/select-field-options';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewSelectCellProps {
  field: SelectFieldAttributes;
}

export const TableViewSelectCell = ({ field }: TableViewSelectCellProps) => {
  const record = useRecord();
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    record.getSelectValue(field)
  );

  React.useEffect(() => {
    setSelectedValue(record.getSelectValue(field));
  }, [record.versionId]);

  const selectOptions = Object.values(field.options ?? {});
  const selectedOption = selectOptions.find(
    (option) => option.id === selectedValue
  );

  if (!record.canEdit) {
    return (
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
    );
  }

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
          values={selectedValue ? [selectedValue] : []}
          allowAdd={true}
          onSelect={(id) => {
            if (!record.canEdit) return;

            if (selectedValue === id) {
              setSelectedValue('');
              record.removeFieldValue(field);
            } else {
              record.updateFieldValue(field, {
                type: 'select',
                value: id,
              });
              setOpen(false);
            }
            setSelectedValue(id);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
