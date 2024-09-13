import React from 'react';
import { RecordNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { AttributeTypes } from '@/lib/constants';

interface RecordNameProps {
  record: RecordNode;
}

export const RecordName = ({ record }: RecordNameProps) => {
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

  return (
    <SmartTextInput
      value={record.name}
      onChange={(value) => {
        if (isPending) {
          return;
        }

        if (value === record.name) {
          return;
        }

        mutate({
          nodeId: record.id,
          type: AttributeTypes.Name,
          key: '1',
          textValue: value,
          numberValue: null,
          foreignNodeId: null,
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
