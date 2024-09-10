import React from 'react';
import isHotkey from 'is-hotkey';
import { RecordNode } from '@/types/databases';
import { NumberFieldNode } from '@/types/databases';
import { useUpdateNumberFieldValueMutation } from '@/mutations/use-update-number-field-value-mutation';

const getNumberValue = (
  record: RecordNode,
  field: NumberFieldNode,
): number | null => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.numberValue ?? null;
};

interface TableViewNumberCellProps {
  record: RecordNode;
  field: NumberFieldNode;
}

export const TableViewNumberCell = ({
  record,
  field,
}: TableViewNumberCellProps) => {
  const { mutate, isPending } = useUpdateNumberFieldValueMutation();

  const canEdit = true;

  const [input, setInput] = React.useState<string>(
    getNumberValue(record, field)?.toString() ?? '',
  );

  React.useEffect(() => {
    setInput(getNumberValue(record, field)?.toString() ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: number | null, previous: number | null) => {
    if (current !== previous) {
      mutate({
        recordId: record.id,
        fieldId: field.id,
        value: current,
      });
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
          saveIfChanged(null, getNumberValue(record, field));
        } else {
          saveIfChanged(number, getNumberValue(record, field));
        }
      }}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          const number = Number(input);
          if (Number.isNaN(number)) {
            setInput('');
            saveIfChanged(null, getNumberValue(record, field));
          } else {
            saveIfChanged(number, getNumberValue(record, field));
          }
          e.preventDefault();
        }
      }}
    />
  );
};
