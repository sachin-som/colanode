import React from 'react';
import { LocalNode } from '@/types/nodes';
import { match } from 'ts-pattern';
import { FieldType } from '@/types/databases';
import { TableViewTextCell } from '@/components/databases/tables/cells/table-view-text-cell';
import { TableViewNumberCell } from '@/components/databases/tables/cells/table-view-number-cell';
import { TableViewBooleanCell } from '@/components/databases/tables/cells/table-view-boolean-cell';

interface TableViewFieldCellProps {
  record: LocalNode;
  field: LocalNode;
}

export const TableViewFieldCell = ({
  record,
  field,
}: TableViewFieldCellProps) => {
  const type = field.attrs?.type as FieldType;
  return match(type)
    .with('text', () => <TableViewTextCell record={record} field={field} />)
    .with('number', () => <TableViewNumberCell record={record} field={field} />)
    .with('boolean', () => (
      <TableViewBooleanCell record={record} field={field} />
    ))
    .otherwise(() => null);
};
