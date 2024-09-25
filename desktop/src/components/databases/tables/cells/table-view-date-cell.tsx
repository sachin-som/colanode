import React from 'react';
import { RecordNode, EmailFieldNode, DateFieldNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { DatePicker } from '@/components/ui/date-picker';

interface TableViewDateCellProps {
  record: RecordNode;
  field: DateFieldNode;
}

export const TableViewDateCell = ({
  record,
  field,
}: TableViewDateCellProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;

  return (
    <DatePicker
      value={record.attributes[field.id]}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === null || newValue === undefined) {
          deleteNodeAttribute({
            nodeId: record.id,
            key: field.id,
          });
        } else {
          setNodeAttribute({
            nodeId: record.id,
            key: field.id,
            value: newValue.toISOString(),
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
