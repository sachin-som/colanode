import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { BooleanFieldNode, RecordNode } from '@/types/databases';
import { useNodeAttributeUpsertMutation } from '@/mutations/use-node-attribute-upsert-mutation';
import { useNodeAttributeDeleteMutation } from '@/mutations/use-node-attribute-delete-mutation';

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

interface RecordBooleanValueProps {
  record: RecordNode;
  field: BooleanFieldNode;
}

export const RecordBooleanValue = ({
  record,
  field,
}: RecordBooleanValueProps) => {
  const { mutate: upsertNodeAttribute, isPending: isUpsertingNodeAttribute } =
    useNodeAttributeUpsertMutation();
  const { mutate: deleteNodeAttribute, isPending: isDeletingNodeAttribute } =
    useNodeAttributeDeleteMutation();

  const isPending = isUpsertingNodeAttribute || isDeletingNodeAttribute;
  const canEdit = true;

  const [input, setInput] = React.useState<boolean>(
    getBooleanValue(record, field),
  );

  React.useEffect(() => {
    setInput(getBooleanValue(record, field));
  }, [record.versionId]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-start p-1">
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
              upsertNodeAttribute({
                nodeId: record.id,
                type: field.id,
                key: '1',
                numberValue: 1,
                textValue: null,
                foreignNodeId: null,
              });
            } else {
              deleteNodeAttribute({
                nodeId: record.id,
                type: field.id,
                key: '1',
              });
            }
          }
        }}
      />
    </div>
  );
};
