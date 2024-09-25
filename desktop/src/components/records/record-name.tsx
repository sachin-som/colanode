import React from 'react';
import { RecordNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface RecordNameProps {
  record: RecordNode;
}

export const RecordName = ({ record }: RecordNameProps) => {
  const { mutate, isPending } = useNodeAttributeSetMutation();

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
          key: 'name',
          value: value,
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
