import React from 'react';
import { BreadcrumbNode } from '@/types/workspaces';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { SmartTextInput } from '@/components/ui/smart-text-input';

interface BreadcrumbItemEditorProps {
  node: BreadcrumbNode;
}

export const BreadcrumbItemEditor = ({ node }: BreadcrumbItemEditorProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();

  return (
    <div>
      <SmartTextInput
        value={node.name}
        onChange={(newName) => {
          if (isSettingNodeAttribute) return;
          if (newName === node.name) return;

          setNodeAttribute({
            nodeId: node.id,
            key: 'name',
            value: newName,
          });
        }}
      />
    </div>
  );
};
