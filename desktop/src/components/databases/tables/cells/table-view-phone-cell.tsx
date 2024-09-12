import React from 'react';
import { RecordNode, PhoneFieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

const getPhoneValue = (record: RecordNode, field: PhoneFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewPhoneCellProps {
  record: RecordNode;
  field: PhoneFieldNode;
}

export const TableViewPhoneCell = ({
  record,
  field,
}: TableViewPhoneCellProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  return (
    <SmartTextInput
      value={getPhoneValue(record, field)}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === getPhoneValue(record, field)) {
          return;
        }

        if (newValue === null || newValue === '') {
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
            numberValue: 1,
            textValue: newValue,
            foreignNodeId: null,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
