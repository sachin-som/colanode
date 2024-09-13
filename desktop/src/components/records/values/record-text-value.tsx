import React from 'react';
import { RecordNode, TextFieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

const getTextValue = (record: RecordNode, field: TextFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface RecordTextValueProps {
  record: RecordNode;
  field: TextFieldNode;
}

export const RecordTextValue = ({ record, field }: RecordTextValueProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  return (
    <SmartTextInput
      value={getTextValue(record, field)}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === getTextValue(record, field)) {
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
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm shadow-none focus-visible:cursor-text"
    />
  );
};
