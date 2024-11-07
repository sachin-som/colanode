import React from 'react';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { BooleanFieldAttributes } from '@colanode/core';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewBooleanCellProps {
  field: BooleanFieldAttributes;
}

export const TableViewBooleanCell = ({ field }: TableViewBooleanCellProps) => {
  const record = useRecord();

  const [input, setInput] = React.useState<boolean>(
    record.getBooleanValue(field)
  );

  React.useEffect(() => {
    setInput(record.getBooleanValue(field));
  }, [record.versionId]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-center p-1">
      <Checkbox
        checked={input}
        disabled={!record.canEdit}
        onCheckedChange={(e) => {
          if (!record.canEdit) return;

          if (typeof e === 'boolean') {
            setInput(e.valueOf());
            record.updateFieldValue(field, {
              type: 'boolean',
              value: e.valueOf(),
            });
          }
        }}
      />
    </div>
  );
};
