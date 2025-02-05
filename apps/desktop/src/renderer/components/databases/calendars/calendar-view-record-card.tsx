import { RecordFieldValue } from '@/renderer/components/records/record-field-value';
import { useRecord } from '@/renderer/contexts/record';
import { useDatabaseView } from '@/renderer/contexts/database-view';
import { useLayout } from '@/renderer/contexts/layout';

export const CalendarViewRecordCard = () => {
  const layout = useLayout();
  const view = useDatabaseView();
  const record = useRecord();

  const name = record.name;
  const hasName = name !== null && name !== '';

  return (
    <div
      role="presentation"
      key={record.id}
      className="animate-fade-in flex justify-start items-start cursor-pointer flex-col gap-1 rounded-md border p-2 hover:bg-gray-50"
      onClick={() => {
        layout.previewLeft(record.id, true);
      }}
    >
      <p className={hasName ? '' : 'text-muted-foreground'}>
        {name ?? 'Unnamed'}
      </p>
      {view.fields.length > 0 && (
        <div className="flex flex-col gap-1 mt-2">
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div key={viewField.field.id}>
                <RecordFieldValue field={viewField.field} readOnly={true} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
