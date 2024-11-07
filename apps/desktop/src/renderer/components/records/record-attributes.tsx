import { RecordName } from '@/renderer/components/records/record-name';
import { useDatabase } from '@/renderer/contexts/database';
import { RecordField } from '@/renderer/components/records/record-field';
import { RecordFieldValue } from '@/renderer/components/records/record-field-value';

export const RecordAttributes = () => {
  const database = useDatabase();

  return (
    <div className="flex flex-col gap-2">
      <RecordName />
      <div className="flex flex-row gap-2">
        <div className="flex w-60 flex-col gap-2">
          {database.fields.map((field) => (
            <RecordField key={field.id} field={field} />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {database.fields.map((field) => {
            return <RecordFieldValue key={`value-${field.id}`} field={field} />;
          })}
        </div>
      </div>
    </div>
  );
};
