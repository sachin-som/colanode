import React from 'react';
import { MultiSelectField, RecordNode } from '@/types/databases';
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

const getMultiSelectValues = (
  record: RecordNode,
  field: MultiSelectField,
): string[] => {
  const attrs = record.attrs;
  if (!attrs) {
    return [];
  }

  const fieldValue = attrs[field.id];
  return Array.isArray(fieldValue) ? fieldValue : [];
};

interface TableViewMultiSelectCellProps {
  record: RecordNode;
  field: MultiSelectField;
}

export const TableViewMultiSelectCell = ({
  record,
  field,
}: TableViewMultiSelectCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation({
    mutationFn: async (newValues: string[]) => {
      if (newValues.length > 0) {
        const values = JSON.stringify(newValues);
        const query = sql`
          UPDATE nodes
          SET attrs = json_set(coalesce(attrs, '{}'), '$.${sql.ref(field.id)}', ${sql.raw(values)}),
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
  const values = getMultiSelectValues(record, field);
  const [selectedValues, setSelectedValues] = React.useState(values);

  React.useEffect(() => {
    setSelectedValues(getMultiSelectValues(record, field));
  }, [record.versionId]);

  const selectedOptions = field.options?.filter((option) =>
    selectedValues.includes(option.id),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-1">
          {selectedOptions?.map((option) => (
            <SelectOptionBadge
              key={option.id}
              name={option.name}
              color={option.color}
            />
          ))}
          {selectedOptions?.length === 0 && ' '}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1">
        <SelectFieldOptions
          field={field}
          values={selectedValues}
          onSelect={(id) => {
            if (isPending) return;

            let newValues: string[];
            if (selectedValues.includes(id)) {
              newValues = selectedValues.filter((v) => v !== id);
            } else {
              newValues = [...selectedValues, id];
            }

            setSelectedValues(newValues);
            mutate(newValues, {
              onSuccess: () => {
                setOpen(false);
              },
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
