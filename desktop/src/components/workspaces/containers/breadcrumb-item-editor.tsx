import React from 'react';
import { BreadcrumbNode } from '@/types/workspaces';
import { SmartTextInput } from '@/components/ui/smart-text-input';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/contexts/workspace';

interface BreadcrumbItemEditorProps {
  node: BreadcrumbNode;
}

export const BreadcrumbItemEditor = ({ node }: BreadcrumbItemEditorProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();

  return (
    <div>
      <SmartTextInput
        value={node.name}
        onChange={(newName) => {
          if (isPending) return;
          if (newName === node.name) return;

          mutate({
            input: {
              type: 'node_attribute_set',
              nodeId: node.id,
              attribute: 'name',
              value: newName,
              userId: workspace.userId,
            },
          });
        }}
      />
    </div>
  );
};
