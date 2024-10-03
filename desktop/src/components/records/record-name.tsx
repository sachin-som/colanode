import React from 'react';
import { RecordNode } from '@/types/databases';
import { useMutation } from '@/hooks/use-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useWorkspace } from '@/contexts/workspace';

interface RecordNameProps {
  record: RecordNode;
}

export const RecordName = ({ record }: RecordNameProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

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
          input: {
            type: 'node_attribute_set',
            nodeId: record.id,
            attribute: 'name',
            value: value,
            userId: workspace.userId,
          },
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
