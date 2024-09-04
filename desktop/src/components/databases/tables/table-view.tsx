import React from 'react';
import { LocalNode } from '@/types/nodes';
import { TableViewHeader } from '@/components/databases/tables/table-view-header';
import { TableViewBody } from '@/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/components/databases/tables/table-view-record-create-row';

interface TableViewProps {
  node: LocalNode;
}

export const TableView = ({ node }: TableViewProps) => {
  return (
    <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
      <TableViewHeader />
      <TableViewBody />
      <TableViewRecordCreateRow />
    </div>
  );
};
