import React from 'react';
import { RecordNode, EmailFieldNode } from '@/types/databases';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface RecordEmailValueProps {
  record: RecordNode;
  field: EmailFieldNode;
}

export const RecordEmailValue = ({ record, field }: RecordEmailValueProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  const canEdit = true;

  return (
    <SmartTextInput
      value={record.attributes[field.id]}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === null || newValue === '') {
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
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm shadow-none focus-visible:cursor-text"
    />
  );
};
