import React from 'react';
import { RecordNode, PhoneFieldNode } from '@/types/databases';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface TableViewPhoneCellProps {
  record: RecordNode;
  field: PhoneFieldNode;
}

export const TableViewPhoneCell = ({
  record,
  field,
}: TableViewPhoneCellProps) => {
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

        if (newValue === record.attributes[field.id]) {
          return;
        }

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
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
