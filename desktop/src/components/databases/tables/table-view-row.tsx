import { LocalNode } from '@/types/nodes';
import React from 'react';
import { TableViewNameCell } from '@/components/databases/tables/table-view-name-cell';
import { getDefaultFieldWidth } from '@/lib/databases';
import { useDatabase } from '@/contexts/database';
import { TableViewFieldCell } from './table-view-field-cell';
import { FieldType } from '@/types/databases';

interface TableViewRowProps {
  index: number;
  node: LocalNode;
}

export const TableViewRow = ({ index, node }: TableViewRowProps) => {
  const database = useDatabase();
  const nameCellWidth = getDefaultFieldWidth('name') + 'px';
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
        style={{ width: nameCellWidth, minWidth: nameCellWidth }}
      >
        <TableViewNameCell node={node} />
      </div>
      {database.fields.map((field) => {
        const width = getDefaultFieldWidth(field.attrs?.type as FieldType);
        return (
          <div
            key={`row-${node.id}-${field.id}`}
            className="h-8 border-r"
            style={{ width: width }}
          >
            <TableViewFieldCell record={node} field={field} />
          </div>
        );
      })}
      <div className="w-8" />
    </div>
  );
};
