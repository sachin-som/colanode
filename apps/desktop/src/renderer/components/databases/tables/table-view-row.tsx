import { TableViewNameCell } from '@/renderer/components/databases/tables/table-view-name-cell';
import { TableViewFieldCell } from '@/renderer/components/databases/tables/table-view-field-cell';
import { RecordNode } from '@colanode/core';
import { useView } from '@/renderer/contexts/view';
import { RecordProvider } from '@/renderer/components/records/record-provider';

interface TableViewRowProps {
  index: number;
  record: RecordNode;
}

export const TableViewRow = ({ index, record }: TableViewRowProps) => {
  const view = useView();

  return (
    <RecordProvider record={record}>
      <div className="animate-fade-in flex flex-row items-center gap-0.5 border-b">
        <span
          className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground"
          style={{ width: '30px', minWidth: '30px' }}
        >
          {index + 1}
        </span>
        <div
          className="h-8 border-r"
          style={{ width: `${view.nameWidth}px`, minWidth: '300px' }}
        >
          <TableViewNameCell record={record} />
        </div>
        {view.fields.map((field) => {
          return (
            <div
              key={`row-${record.id}-${field.field.id}`}
              className="h-8 border-r"
              style={{ width: `${field.width}px` }}
            >
              <TableViewFieldCell record={record} field={field.field} />
            </div>
          );
        })}
        <div className="w-8" />
      </div>
    </RecordProvider>
  );
};
