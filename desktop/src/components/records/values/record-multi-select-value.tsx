import React from 'react';
import { MultiSelectFieldNode, RecordNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface RecordMultiSelectValueProps {
  record: RecordNode;
  field: MultiSelectFieldNode;
}

export const RecordMultiSelectValue = ({
  record,
  field,
}: RecordMultiSelectValueProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

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
              mutate({
                input: {
                  type: 'node_attribute_delete',
                  nodeId: record.id,
                  attribute: field.id,
                  userId: workspace.userId,
                },
              });
            } else {
              const values = [...selectedValues, id];
              setSelectedValues(values);
              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: record.id,
                  attribute: field.id,
                  value: values,
                  userId: workspace.userId,
                },
              });
            }
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
