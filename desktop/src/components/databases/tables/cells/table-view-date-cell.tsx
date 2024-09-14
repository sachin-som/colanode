import React from 'react';
import { RecordNode, EmailFieldNode, DateFieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { DatePicker } from '@/components/ui/date-picker';

const getDateValue = (
  record: RecordNode,
  field: DateFieldNode,
): Date | null => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ? new Date(attribute.textValue) : null;
};

interface TableViewDateCellProps {
  record: RecordNode;
  field: DateFieldNode;
}

export const TableViewDateCell = ({
  record,
  field,
}: TableViewDateCellProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  return (
    <DatePicker
      value={getDateValue(record, field)}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === null || newValue === undefined) {
          deleteNodeAttribute({
            nodeId: record.id,
            type: field.id,
            key: '1',
          });
        } else {
          upsertNodeAttribute({
            nodeId: record.id,
            type: field.id,
            key: '1',
            textValue: newValue.toISOString(),
            numberValue: null,
            foreignNodeId: null,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
