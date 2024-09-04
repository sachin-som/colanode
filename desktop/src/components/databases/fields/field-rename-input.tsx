import React from 'react';
import isHotkey from 'is-hotkey';
import { Input } from '@/components/ui/input';
import { Field } from '@/types/databases';
import { useWorkspace } from '@/contexts/workspace';
import { useMutation } from '@tanstack/react-query';
import { NeuronId } from '@/lib/id';
import { sql } from 'kysely';

interface FieldRenameInputProps {
  field: Field;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const workspace = useWorkspace();
  const [name, setName] = React.useState(field.name);

  const { mutate, isPending } = useMutation({
    mutationFn: async (newName: string) => {
      const query = sql`
        UPDATE nodes
        SET attrs = json_set(attrs, '$.name', ${newName}),
            updated_at = ${new Date().toISOString()},
            updated_by = ${workspace.userId},
            version_id = ${NeuronId.generate(NeuronId.Type.Version)}
        WHERE id = ${field.id}
      `.compile(workspace.schema);

      await workspace.mutate(query);
    },
  });

  return (
    <div className="w-full p-1">
      <Input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={() => {
          if (name !== field.name && !isPending) {
            mutate(name);
          }
        }}
        onKeyDown={(e) => {
          if (isHotkey('enter', e) && name !== field.name && !isPending) {
            mutate(name);
          }
        }}
      />
    </div>
  );
};
