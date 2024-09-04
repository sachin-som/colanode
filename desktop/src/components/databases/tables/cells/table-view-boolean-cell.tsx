import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { BooleanField, RecordNode } from '@/types/databases';
import { sql } from 'kysely';

const getBooleanValue = (record: RecordNode, field: BooleanField): boolean => {
  const attrs = record.attrs;

  if (!attrs) {
    return false;
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'number') {
    return fieldValue === 1;
  }

  return false;
};

interface TableViewBooleanCellProps {
  record: RecordNode;
  field: BooleanField;
}

export const TableViewBooleanCell = ({
  record,
  field,
}: TableViewBooleanCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: boolean) => {
      if (newValue) {
        const query = sql`
          UPDATE nodes
          SET attrs = json_set(coalesce(attrs, '{}'), '$.${sql.ref(field.id)}', 1),
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

  const [input, setInput] = React.useState<boolean>(
    getBooleanValue(record, field),
  );

  React.useEffect(() => {
    setInput(getBooleanValue(record, field));
  }, [record.versionId]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-center p-1">
      <Checkbox
        checked={input}
        disabled={isPending || !canEdit}
        onCheckedChange={(e) => {
          if (isPending) return;
          if (!canEdit) return;

          if (typeof e === 'boolean') {
            setInput(e.valueOf());
            mutate(e.valueOf());
          }
        }}
      />
    </div>
  );
};
