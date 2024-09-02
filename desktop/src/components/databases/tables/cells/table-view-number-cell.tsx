import React from 'react';
import isHotkey from 'is-hotkey';
import { useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { LocalNode } from '@/types/nodes';
import { NeuronId } from '@/lib/id';

const getNumberValue = (record: LocalNode, field: LocalNode): number | null => {
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
  record: LocalNode;
  field: LocalNode;
}

export const TableViewNumberCell = ({
  record,
  field,
}: TableViewNumberCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: number) => {
      const newAttrs = {
        ...record.attrs,
        [field.id]: newValue,
      };
      const query = workspace.schema
        .updateTable('nodes')
        .set({
          attrs: newAttrs ? JSON.stringify(newAttrs) : null,
          updated_at: new Date().toISOString(),
          updated_by: workspace.userId,
          version_id: NeuronId.generate(NeuronId.Type.Version),
        })
        .where('id', '=', record.id)
        .compile();

      await workspace.mutate(query);
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
    if (current !== null && current !== previous) {
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
        } else {
          saveIfChanged(number, getNumberValue(record, field));
        }
      }}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          const number = Number(input);
          if (Number.isNaN(number)) {
            setInput('');
          } else {
            saveIfChanged(number, getNumberValue(record, field));
          }
          e.preventDefault();
        }
      }}
    />
  );
};
