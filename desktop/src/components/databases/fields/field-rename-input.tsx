import React from 'react';
import { FieldNode } from '@/types/databases';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface FieldRenameInputProps {
  field: FieldNode;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <div className="w-full p-1">
      <SmartTextInput
        value={field.name}
        onChange={(newName) => {
          if (isPending) return;
          if (newName === field.name) return;

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: field.id,
              attribute: 'name',
              value: newName,
              userId: workspace.userId,
            },
          });
        }}
      />
    </div>
  );
};
