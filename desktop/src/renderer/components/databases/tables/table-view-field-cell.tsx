import React from 'react';
import { RecordNode } from '@/registry';
import { FieldAttributes } from '@/registry';
import { TableViewTextCell } from '@/renderer/components/databases/tables/cells/table-view-text-cell';
import { TableViewNumberCell } from '@/renderer/components/databases/tables/cells/table-view-number-cell';
import { TableViewBooleanCell } from '@/renderer/components/databases/tables/cells/table-view-boolean-cell';
import { TableViewCreatedAtCell } from '@/renderer/components/databases/tables/cells/table-view-created-at-cell';
import { TableViewCreatedByCell } from '@/renderer/components/databases/tables/cells/table-view-created-by-cell';
import { TableViewSelectCell } from '@/renderer/components/databases/tables/cells/table-view-select-cell';
import { TableViewPhoneCell } from '@/renderer/components/databases/tables/cells/table-view-phone-cell';
import { TableViewEmailCell } from '@/renderer/components/databases/tables/cells/table-view-email-cell';
import { TableViewUrlCell } from '@/renderer/components/databases/tables/cells/table-view-url-cell';
import { TableViewMultiSelectCell } from '@/renderer/components/databases/tables/cells/table-view-multi-select-cell';
import { TableViewDateCell } from '@/renderer/components/databases/tables/cells/table-view-date-cell';

interface TableViewFieldCellProps {
  record: RecordNode;
  field: FieldAttributes;
}

export const TableViewFieldCell = ({
  record,
  field,
}: TableViewFieldCellProps) => {
  switch (field.type) {
    case 'text':
      return <TableViewTextCell field={field} />;
    case 'number':
      return <TableViewNumberCell field={field} />;
    case 'boolean':
      return <TableViewBooleanCell field={field} />;
    case 'createdAt':
      return <TableViewCreatedAtCell field={field} />;
    case 'createdBy':
      return <TableViewCreatedByCell field={field} />;
    case 'select':
      return <TableViewSelectCell field={field} />;
    case 'phone':
      return <TableViewPhoneCell field={field} />;
    case 'email':
      return <TableViewEmailCell field={field} />;
    case 'url':
      return <TableViewUrlCell field={field} />;
    case 'multiSelect':
      return <TableViewMultiSelectCell field={field} />;
    case 'collaborator':
      return null;
    case 'date':
      return <TableViewDateCell field={field} />;
    case 'file':
      return null;
    default:
      return null;
  }
};
