import React from 'react';
import { RecordNode } from '@/types/databases';
import { NumberFieldNode } from '@/types/databases';
import { SmartNumberInput } from '@/components/ui/smart-number-input';
import { useMutation } from '@/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface RecordNumberValueProps {
  record: RecordNode;
  field: NumberFieldNode;
}

export const RecordNumberValue = ({
  record,
  field,
}: RecordNumberValueProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const canEdit = true;

  return (
    <SmartNumberInput
      value={record.attributes[field.id]}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === record.attributes[field.id]) {
          return;
        }

        if (newValue === null) {
          mutate({
            input: {
              type: 'node_attribute_delete',
              nodeId: record.id,
              attribute: field.id,
              userId: workspace.userId,
            },
          });
        } else {
          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: record.id,
              attribute: field.id,
              value: newValue,
              userId: workspace.userId,
            },
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
