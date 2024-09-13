import React from 'react';
import { RecordNode } from '@/types/databases';
import { RecordName } from '@/components/records/record-name';
import { useDatabase } from '@/contexts/database';
import { RecordField } from '@/components/records/record-field';
import { RecordFieldValue } from '@/components/records/record-field-value';

interface RecordAttributesProps {
  record: RecordNode;
}

export const RecordAttributes = ({ record }: RecordAttributesProps) => {
  const database = useDatabase();
  return (
    <div className="flex flex-col gap-2">
      <RecordName record={record} />
      <div className="flex flex-row gap-2">
        <div className="flex w-60 flex-col gap-2">
          {database.fields.map((field) => (
            <RecordField key={field.id} field={field} />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {database.fields.map((field) => {
            return (
              <RecordFieldValue
                key={`value-${field.id}`}
                field={field}
                record={record}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
