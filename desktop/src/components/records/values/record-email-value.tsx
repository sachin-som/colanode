import React from 'react';
import { RecordNode, EmailFieldNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface RecordEmailValueProps {
  record: RecordNode;
  field: EmailFieldNode;
}

export const RecordEmailValue = ({ record, field }: RecordEmailValueProps) => {
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
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm shadow-none focus-visible:cursor-text"
    />
  );
};
