import React from 'react';
import { BreadcrumbNode } from '@/types/workspaces';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { AttributeTypes } from '@/lib/constants';

interface BreadcrumbItemEditorProps {
  node: BreadcrumbNode;
}

export const BreadcrumbItemEditor = ({ node }: BreadcrumbItemEditorProps) => {
  const { mutate, isPending } = useNodeAttributeUpsertMutation();

  return (
    <div>
      <SmartTextInput
        value={node.name}
        onChange={(newName) => {
          if (isPending) return;
          if (newName === node.name) return;

          mutate({
            nodeId: node.id,
            type: AttributeTypes.Name,
            key: '1',
            textValue: newName,
            numberValue: null,
            foreignNodeId: null,
          });
        }}
      />
    </div>
  );
};
