import React from 'react';
import isHotkey from 'is-hotkey';
import { useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { RecordNode } from '@/types/databases';
import { NeuronId } from '@/lib/id';
import { NumberField } from '@/types/databases';
import { sql } from 'kysely';

const getNumberValue = (
  record: RecordNode,
  field: NumberField,
): number | null => {
  const attrs = record.attrs;

  if (!attrs) {
    return null;
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'number') {
    return fieldValue;
  }

  return null;
};

interface TableViewNumberCellProps {
  record: RecordNode;
  field: NumberField;
}

export const TableViewNumberCell = ({
  record,
  field,
}: TableViewNumberCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: number | null) => {
      if (newValue !== null) {
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

  const [input, setInput] = React.useState<string>(
    getNumberValue(record, field)?.toString() ?? '',
  );

  useEffect(() => {
    setInput(getNumberValue(record, field)?.toString() ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: number | null, previous: number | null) => {
    if (current !== previous) {
      mutate(current);
    }
  };

  return (
    <input
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
      readOnly={!canEdit || isPending}
      value={input ?? ''}
      onChange={(e) => setInput(e.target.value)}
      onBlur={() => {
        const number = Number(input);
        if (Number.isNaN(number)) {
          setInput('');
          saveIfChanged(null, getNumberValue(record, field));
        } else {
          saveIfChanged(number, getNumberValue(record, field));
        }
      }}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          const number = Number(input);
          if (Number.isNaN(number)) {
            setInput('');
            saveIfChanged(null, getNumberValue(record, field));
          } else {
            saveIfChanged(number, getNumberValue(record, field));
          }
          e.preventDefault();
        }
      }}
    />
  );
};
