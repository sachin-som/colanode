import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BooleanFieldNode, RecordNode } from '@/types/databases';
import { useNodeAttributeSetMutation } from '@/mutations/use-node-attribute-set-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';

interface TableViewBooleanCellProps {
  record: RecordNode;
  field: BooleanFieldNode;
}

export const TableViewBooleanCell = ({
  record,
  field,
}: TableViewBooleanCellProps) => {
  const { mutate: setNodeAttribute, isPending: isSettingNodeAttribute } =
    useNodeAttributeSetMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const isPending = isSettingNodeAttribute || isDeletingNodeAttribute;
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
              setNodeAttribute({
                nodeId: record.id,
                key: field.id,
                value: checked,
              });
            } else {
              deleteNodeAttribute({
                nodeId: record.id,
                key: field.id,
              });
            }
          }
        }}
      />
    </div>
  );
};
