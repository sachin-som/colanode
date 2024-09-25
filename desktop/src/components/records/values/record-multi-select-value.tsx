import React from 'react';
import { MultiSelectFieldNode, RecordNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';

interface RecordMultiSelectValueProps {
  record: RecordNode;
  field: MultiSelectFieldNode;
}

export const RecordMultiSelectValue = ({
  record,
  field,
}: RecordMultiSelectValueProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;

  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState(
    (record.attributes[field.id] as string[]) ?? [],
  );

  React.useEffect(() => {
    setSelectedValues((record.attributes[field.id] as string[]) ?? []);
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
              const values = selectedValues.filter((v) => v !== id);
              setSelectedValues(values);
              deleteNodeAttribute({
                nodeId: record.id,
                key: field.id,
              });
            } else {
              const values = [...selectedValues, id];
              setSelectedValues(values);
              setNodeAttribute({
                nodeId: record.id,
                key: field.id,
                value: values,
              });
            }
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
