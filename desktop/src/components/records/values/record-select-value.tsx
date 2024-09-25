import React from 'react';
import { RecordNode, SelectFieldNode } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';

interface RecordSelectValueProps {
  record: RecordNode;
  field: SelectFieldNode;
}

export const RecordSelectValue = ({
  record,
  field,
}: RecordSelectValueProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;

  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(
    record.attributes[field.id] ?? '',
  );

  React.useEffect(() => {
    setSelectedValue(record.attributes[field.id] ?? '');
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
              deleteNodeAttribute({
                nodeId: record.id,
                key: field.id,
              });
            } else {
              setNodeAttribute(
                {
                  nodeId: record.id,
                  key: field.id,
                  value: id,
                },
                {
                  onSuccess: () => {
                    setOpen(false);
                  },
                },
              );
            }
            setSelectedValue(id);
          }}
          allowAdd={true}
        />
      </PopoverContent>
    </Popover>
  );
};
