import React from 'react';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import { BreadcrumbNode } from '@/types/workspaces';
import { useNodeUpdateNameMutation } from '@/mutations/use-node-update-name-mutation';

interface BreadcrumbItemEditorProps {
  node: BreadcrumbNode;
}

export const BreadcrumbItemEditor = ({ node }: BreadcrumbItemEditorProps) => {
  const [name, setName] = React.useState(node.name ?? '');
  const { mutate } = useNodeUpdateNameMutation();

  const handleNameChange = React.useMemo(
    () =>
      debounce(async (newName: string) => {
        mutate({
          id: node.id,
          name: newName,
        });
      }, 500),
    [node.id],
  );

  return (
    <div>
      <Input
        placeholder="Name"
        value={name}
        onChange={async (e) => {
          const newName = e.target.value;
          setName(newName);
          await handleNameChange(newName);
        }}
      />
    </div>
  );
};
