import React from 'react';
import { FieldNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface FieldRenameInputProps {
  field: FieldNode;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const { mutate, isPending } = useNodeAttributeSetMutation();

  return (
    <div className="w-full p-1">
      <SmartTextInput
        value={field.name}
        onChange={(newName) => {
          if (isPending) return;
          if (newName === field.name) return;

          mutate({
            nodeId: field.id,
            key: 'name',
            value: newName,
          });
        }}
      />
    </div>
  );
};
