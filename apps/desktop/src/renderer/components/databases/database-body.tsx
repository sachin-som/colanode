import { DatabaseNode } from '@colanode/core';
import { DatabaseViews } from '@/renderer/components/databases/database-views';
import { Database } from '@/renderer/components/databases/database';

interface DatabaseBodyProps {
  database: DatabaseNode;
}

export const DatabaseBody = ({ database }: DatabaseBodyProps) => {
  return (
    <Database databaseId={database.id}>
      <DatabaseViews />
    </Database>
  );
};
