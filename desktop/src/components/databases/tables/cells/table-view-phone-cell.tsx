import React from 'react';
import isHotkey from 'is-hotkey';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { RecordNode, PhoneField } from '@/types/databases';
import { sql } from 'kysely';

const getPhoneValue = (record: RecordNode, field: PhoneField): string => {
  const attrs = record.attrs;

  if (!attrs) {
    return '';
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  return '';
};

interface TableViewPhoneCellProps {
  record: RecordNode;
  field: PhoneField;
}

export const TableViewPhoneCell = ({
  record,
  field,
}: TableViewPhoneCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: string) => {
      if (newValue.length > 0) {
        const query = sql`
          UPDATE nodes
          SET attrs = json_set(coalesce(attrs, '{}'), '$.${field.id}', ${newValue}),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${record.id}
        `.compile(workspace.schema);

        await workspace.mutate(query);
      } else {
        const query = sql`
          UPDATE nodes
          SET attrs = json_remove(attrs, '$.${sql.ref(field.id)}'),
              updated_at = ${new Date().toISOString()},
              updated_by = ${workspace.userId},
              version_id = ${NeuronId.generate(NeuronId.Type.Version)}
          WHERE id = ${record.id} AND attrs IS NOT NULL
        `.compile(workspace.schema);

        await workspace.mutate(query);
      }
    },
  });

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getPhoneValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getPhoneValue(record, field) ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: string, previous: string | null) => {
    if (current.length && current !== previous) {
      mutate(current);
    }
  };

  return (
    <input
      value={text}
      readOnly={!canEdit || isPending}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => saveIfChanged(text, getPhoneValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getPhoneValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
