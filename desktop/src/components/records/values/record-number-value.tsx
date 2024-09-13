import React from 'react';
import { RecordNode } from '@/types/databases';
import { NumberFieldNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';
import { SmartNumberInput } from '@/components/ui/smart-number-input';

const getNumberValue = (
  record: RecordNode,
  field: NumberFieldNode,
): number | null => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.numberValue ?? null;
};

interface RecordNumberValueProps {
  record: RecordNode;
  field: NumberFieldNode;
}

export const RecordNumberValue = ({
  record,
  field,
}: RecordNumberValueProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const canEdit = true;
  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;

  return (
    <SmartNumberInput
      value={getNumberValue(record, field)}
      readOnly={!canEdit || isPending}
      onChange={(newValue) => {
        if (isPending) return;
        if (!canEdit) return;

        if (newValue === getNumberValue(record, field)) {
          return;
        }

        if (newValue === null) {
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
            numberValue: newValue,
            textValue: null,
            foreignNodeId: null,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
