import { DatabaseNode, NodeRole } from '@colanode/core';
import { DatabaseViews } from '@/renderer/components/databases/database-views';
import { Database } from '@/renderer/components/databases/database';

interface DatabaseBodyProps {
  database: DatabaseNode;
  role: NodeRole;
}

export const DatabaseBody = ({ database, role }: DatabaseBodyProps) => {
  return (
    <Database database={database} role={role}>
      <DatabaseViews />
    </Database>
  );
};
