import React from 'react';
import { FieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { AttributeTypes } from '@/lib/constants';

interface FieldRenameInputProps {
  field: FieldNode;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

  return (
    <div className="w-full p-1">
      <SmartTextInput
        value={field.name}
        onChange={(newName) => {
          if (isPending) return;
          if (newName === field.name) return;

          mutate({
            nodeId: field.id,
            type: AttributeTypes.Name,
            key: '1',
            textValue: newName,
            numberValue: null,
            foreignNodeId: null,
          });
        }}
      />
    </div>
  );
};
