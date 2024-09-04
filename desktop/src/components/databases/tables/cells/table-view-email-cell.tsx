import React from 'react';
import isHotkey from 'is-hotkey';

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { RecordNode, EmailField } from '@/types/databases';

const getEmailValue = (record: RecordNode, field: EmailField): string => {
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

interface TableViewEmailCellProps {
  record: RecordNode;
  field: EmailField;
}

export const TableViewEmailCell = ({
  record,
  field,
}: TableViewEmailCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: string) => {
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

  const [text, setText] = React.useState<string>(
    getEmailValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getEmailValue(record, field) ?? '');
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
      onBlur={() => saveIfChanged(text, getEmailValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getEmailValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
