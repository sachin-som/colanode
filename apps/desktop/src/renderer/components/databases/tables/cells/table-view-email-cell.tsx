import React from 'react';
import { EmailFieldAttributes } from '@/registry';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';

interface TableViewEmailCellProps {
  field: EmailFieldAttributes;
}

export const TableViewEmailCell = ({ field }: TableViewEmailCellProps) => {
  const record = useRecord();

  return (
    <SmartTextInput
      value={record.getEmailValue(field)}
      readOnly={!record.canEdit}
      onChange={(newValue) => {
        if (!record.canEdit) return;

        if (newValue === null || newValue === '') {
          record.removeFieldValue(field);
        } else {
          record.updateFieldValue(field, {
            type: 'email',
            value: newValue,
          });
        }
      }}
      className="flex h-full w-full cursor-pointer flex-row items-center gap-1 border-none p-1 text-sm focus-visible:cursor-text"
    />
  );
};
