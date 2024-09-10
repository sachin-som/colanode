import React from 'react';
import isHotkey from 'is-hotkey';
import { RecordNode, PhoneFieldNode } from '@/types/databases';
import { useUpdatePhoneFieldValueMutation } from '@/mutations/use-update-phone-field-value-mutation';

const getPhoneValue = (record: RecordNode, field: PhoneFieldNode): string => {
  const attribute = record.attributes.find((attr) => attr.type === field.id);
  return attribute?.textValue ?? '';
};

interface TableViewPhoneCellProps {
  record: RecordNode;
  field: PhoneFieldNode;
}

export const TableViewPhoneCell = ({
  record,
  field,
}: TableViewPhoneCellProps) => {
  const { mutate, isPending } = useUpdatePhoneFieldValueMutation();

  const canEdit = true;

  const [text, setText] = React.useState<string>(
    getPhoneValue(record, field) ?? '',
  );

  React.useEffect(() => {
    setText(getPhoneValue(record, field) ?? '');
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
      onBlur={() => saveIfChanged(text, getPhoneValue(record, field))}
      onKeyDown={(e) => {
        if (isHotkey('enter', e)) {
          saveIfChanged(text, getPhoneValue(record, field));
          e.preventDefault();
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 p-1 text-sm focus-visible:cursor-text"
    />
  );
};
