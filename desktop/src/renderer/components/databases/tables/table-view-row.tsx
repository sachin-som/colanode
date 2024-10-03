import React from 'react';
import { TableViewNameCell } from '@/renderer/components/databases/tables/table-view-name-cell';
import { TableViewFieldCell } from '@/renderer/components/databases/tables/table-view-field-cell';
import { RecordNode } from '@/types/databases';
import { useTableView } from '@/renderer/contexts/table-view';

interface TableViewRowProps {
  index: number;
  record: RecordNode;
}

export const TableViewRow = ({ index, record }: TableViewRowProps) => {
  const tableView = useTableView();

  return (
    <div className="animate-fade-in flex flex-row items-center gap-0.5 border-b">
      <span
        className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground"
        style={{ width: '30px', minWidth: '30px' }}
      >
        {index + 1}
      </span>
      <div
        className="h-8 border-r"
        style={{ width: `${tableView.getNameWidth()}px`, minWidth: '300px' }}
      >
        <TableViewNameCell record={record} />
      </div>
      {tableView.fields.map((field) => {
        const width = tableView.getFieldWidth(field.id, field.dataType);
        return (
          <div
            key={`row-${record.id}-${field.id}`}
            className="h-8 border-r"
            style={{ width: width }}
          >
            <TableViewFieldCell record={record} field={field} />
          </div>
        );
      })}
      <div className="w-8" />
    </div>
  );
};
