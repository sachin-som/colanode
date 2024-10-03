import React from 'react';
import { RecordNode, DateFieldNode } from '@/types/databases';
import { useMutation } from '@/hooks/use-mutation';
import { DatePicker } from '@/components/ui/date-picker';
import { useWorkspace } from '@/contexts/workspace';

interface TableViewDateCellProps {
  record: RecordNode;
  field: DateFieldNode;
}

export const TableViewDateCell = ({
  record,
  field,
}: TableViewDateCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = true;

  return (
    <DatePicker
      value={record.attributes[field.id]}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === null || newValue === undefined) {
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
              value: newValue.toISOString(),
              userId: workspace.userId,
            },
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
