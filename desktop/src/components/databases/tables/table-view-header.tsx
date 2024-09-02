import React from 'react';
import { useDatabase } from '@/contexts/database';
import { TableViewNameHeader } from '@/components/databases/tables/table-view-name-header';
import { TableViewFieldHeader } from '@/components/databases/tables/table-view-field-header';
import { FieldCreatePopover } from '@/components/databases/fields/field-create-popover';

export const TableViewHeader = () => {
  const database = useDatabase();
  return (
    <div className="flex flex-row items-center gap-0.5">
      <div style={{ width: '30px', minWidth: '30px' }} />
      <TableViewNameHeader />
      {database.fields.map((field, index) => {
        // const isVisible =
        //   viewField.attrs.visible ?? getDefaultFieldVisibility(view.layout);
        // if (!isVisible) return null;

        return (
          <TableViewFieldHeader field={field} key={field.id} index={index} />
        );
      })}
      <FieldCreatePopover />
    </div>
  );
};
