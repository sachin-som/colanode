import { TextFieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewTextCellProps {
  field: TextFieldAttributes;
}

export const TableViewTextCell = ({ field }: TableViewTextCellProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getTextValue(field)}
      readOnly={!record.canEdit}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === record.getTextValue(field)) {
          return;
        }

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'text',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
