import React from 'react';
import { RecordNode, EmailFieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

const getEmailValue = (record: RecordNode, field: EmailFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface RecordEmailValueProps {
  record: RecordNode;
  field: EmailFieldNode;
}

export const RecordEmailValue = ({ record, field }: RecordEmailValueProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  return (
    <SmartTextInput
      value={getEmailValue(record, field)}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

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
            textValue: newValue,
            numberValue: null,
            foreignNodeId: null,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm shadow-none focus-visible:cursor-text"
    />
  );
};
