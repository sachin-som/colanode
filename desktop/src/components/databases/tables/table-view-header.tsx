import React from 'react';
import { useTableView } from '@/contexts/table-view';
import { TableViewNameHeader } from '@/components/databases/tables/table-view-name-header';
import { TableViewFieldHeader } from '@/components/databases/tables/table-view-field-header';
import { FieldCreatePopover } from '@/components/databases/fields/field-create-popover';

export const TableViewHeader = () => {
  const tableView = useTableView();

  return (
    <div className="flex flex-row items-center gap-0.5">
      <div style={{ width: '30px', minWidth: '30px' }} />
      <TableViewNameHeader />
      {tableView.fields.map((field, index) => {
        return (
          <TableViewFieldHeader field={field} key={field.id} index={index} />
        );
      })}
      <FieldCreatePopover />
    </div>
  );
};
