import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BooleanFieldNode, RecordNode } from '@/types/databases';
import { useUpdateBooleanFieldValueMutation } from '@/mutations/use-update-boolean-field-value-mutation';

const getBooleanValue = (
  record: RecordNode,
  field: BooleanFieldNode,
): boolean => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  if (!attribute) {
    return false;
  }

  return attribute.numberValue === 1;
};

interface TableViewBooleanCellProps {
  record: RecordNode;
  field: BooleanFieldNode;
}

export const TableViewBooleanCell = ({
  record,
  field,
}: TableViewBooleanCellProps) => {
  const { mutate, isPending } = useUpdateBooleanFieldValueMutation();

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
            mutate({
              recordId: record.id,
              fieldId: field.id,
              value: e.valueOf(),
            });
          }
        }}
      />
    </div>
  );
};
