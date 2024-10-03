import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BooleanFieldNode, RecordNode } from '@/types/databases';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface TableViewBooleanCellProps {
  record: RecordNode;
  field: BooleanFieldNode;
}

export const TableViewBooleanCell = ({
  record,
  field,
}: TableViewBooleanCellProps) => {
  const workspace = useWorkspace();
  const { mutate, isPending } = useMutation();
  const canEdit = true;

  const [input, setInput] = React.useState<boolean>(
    (record.attributes[field.id] as boolean) ?? false,
  );

  React.useEffect(() => {
    setInput((record.attributes[field.id] as boolean) ?? false);
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
            const checked = e.valueOf();
            if (checked) {
              mutate({
                input: {
                  type: 'node_attribute_set',
                  nodeId: record.id,
                  attribute: field.id,
                  value: checked,
                  userId: workspace.userId,
                },
              });
            } else {
              mutate({
                input: {
                  type: 'node_attribute_delete',
                  nodeId: record.id,
                  attribute: field.id,
                  userId: workspace.userId,
                },
              });
            }
          }
        }}
      />
    </div>
  );
};
