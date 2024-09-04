import React from 'react';
import { RecordNode, SelectField } from '@/types/databases';
import { SelectOptionBadge } from '@/components/databases/fields/select-option-badge';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SelectFieldOptions } from '@/components/databases/fields/select-field-options';
import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { NeuronId } from '@/lib/id';
import { sql } from 'kysely';

const getSelectValue = (
  record: RecordNode,
  field: SelectField,
): string | null => {
  const attrs = record.attrs;

  if (!attrs) {
    return null;
  }

  const fieldValue = attrs[field.id];

  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  return null;
};

interface TableViewSelectCellProps {
  record: RecordNode;
  field: SelectField;
}

export const TableViewSelectCell = ({
  record,
  field,
}: TableViewSelectCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValue: string | null) => {
      if (newValue !== null && newValue.length > 0) {
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

  const [open, setOpen] = React.useState(false);
  const value = getSelectValue(record, field);
  const [selectedValue, setSelectedValue] = React.useState(value);

  React.useEffect(() => {
    setSelectedValue(getSelectValue(record, field) ?? '');
  }, [record.versionId]);

  const selectedOption = field.options?.find(
    (option) => option.id === selectedValue,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="h-full w-full cursor-pointer p-1">
          {selectedOption ? (
            <SelectOptionBadge
              name={selectedOption.name}
              color={selectedOption.color}
            />
          ) : (
            ' '
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={[selectedValue]}
          onSelect={(id) => {
            if (isPending) {
              return;
            }

            if (selectedValue === id) {
              setSelectedValue('');
              mutate(null, {
                onSuccess: () => {
                  setOpen(false);
                },
              });
            } else {
              setSelectedValue(id);
              mutate(id, {
                onSuccess: () => {
                  setOpen(false);
                },
              });
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
