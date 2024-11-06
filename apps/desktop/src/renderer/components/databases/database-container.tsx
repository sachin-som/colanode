import React from 'react';
import { Database } from '@/renderer/components/databases/database';
import { DatabaseViews } from '@/renderer/components/databases/database-views';

interface DatabaseContainerProps {
  nodeId: string;
}

export const DatabaseContainer = ({ nodeId }: DatabaseContainerProps) => {
  return (
    <Database databaseId={nodeId}>
      <DatabaseViews />
    </Database>
  );
};
