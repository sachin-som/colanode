import React from 'react';
import isHotkey from 'is-hotkey';
import { Input } from '@/components/ui/input';
import { FieldNode } from '@/types/databases';
import { useNodeUpdateNameMutation } from '@/mutations/use-node-update-name-mutation';

interface FieldRenameInputProps {
  field: FieldNode;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const { mutate, isPending } = useNodeUpdateNameMutation();
  const [name, setName] = React.useState(field.name);

  return (
    <div className="w-full p-1">
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={() => {
          if (name !== field.name && !isPending) {
            mutate({ id: field.id, name });
          }
        }}
        onKeyDown={(e) => {
          if (isHotkey('enter', e) && name !== field.name && !isPending) {
            mutate({ id: field.id, name });
          }
        }}
      />
    </div>
  );
};
