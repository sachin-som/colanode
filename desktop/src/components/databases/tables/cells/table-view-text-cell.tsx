import React from 'react';
import isHotkey from 'is-hotkey';
import { RecordNode, TextFieldNode } from '@/types/databases';
import { useUpdateTextFieldValueMutation } from '@/mutations/use-update-text-field-value-mutation';

const getTextValue = (record: RecordNode, field: TextFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewTextCellProps {
  record: RecordNode;
  field: TextFieldNode;
}

export const TableViewTextCell = ({
  record,
  field,
}: TableViewTextCellProps) => {
  const { mutate, isPending } = useUpdateTextFieldValueMutation();

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getTextValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getTextValue(record, field) ?? '');
  }, [record.versionId]);

  const saveIfChanged = (current: string, previous: string | null) => {
    if (current.length && current !== previous) {
      mutate({
        recordId: record.id,
        fieldId: field.id,
        value: current,
      });
    }
  };

  return (
    <input
      readOnly={!canEdit || isPending}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => saveIfChanged(text, getTextValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getTextValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
