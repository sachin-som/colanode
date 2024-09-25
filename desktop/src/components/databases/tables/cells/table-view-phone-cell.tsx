import React from 'react';
import { RecordNode, PhoneFieldNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface TableViewPhoneCellProps {
  record: RecordNode;
  field: PhoneFieldNode;
}

export const TableViewPhoneCell = ({
  record,
  field,
}: TableViewPhoneCellProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;

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
          deleteNodeAttribute({
            nodeId: record.id,
            key: field.id,
          });
        } else {
          setNodeAttribute({
            nodeId: record.id,
            key: field.id,
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
