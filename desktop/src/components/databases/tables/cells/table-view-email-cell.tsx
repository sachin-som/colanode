import React from 'react';
import isHotkey from 'is-hotkey';
import { RecordNode, EmailFieldNode } from '@/types/databases';
import { useUpdateEmailFieldValueMutation } from '@/mutations/use-update-email-field-value-mutation';

const getEmailValue = (record: RecordNode, field: EmailFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewEmailCellProps {
  record: RecordNode;
  field: EmailFieldNode;
}

export const TableViewEmailCell = ({
  record,
  field,
}: TableViewEmailCellProps) => {
  const { mutate, isPending } = useUpdateEmailFieldValueMutation();

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getEmailValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getEmailValue(record, field) ?? '');
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
      value={text}
      readOnly={!canEdit || isPending}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => saveIfChanged(text, getEmailValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getEmailValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
