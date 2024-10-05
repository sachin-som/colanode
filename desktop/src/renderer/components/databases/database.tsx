import React from 'react';
import { DatabaseContext } from '@/renderer/contexts/database';
import { useQuery } from '@/renderer/hooks/use-query';
import { useWorkspace } from '@/renderer/contexts/workspace';

interface DatabaseProps {
  databaseId: string;
  children: React.ReactNode;
}

export const Database = ({ databaseId, children }: DatabaseProps) => {
  const workspace = useWorkspace();
  const { data: database, isPending: isDatabasePending } = useQuery({
    type: 'database_get',
    databaseId,
    userId: workspace.userId,
  });

  if (isDatabasePending) {
    return null;
  }

  if (!database) {
    return null;
  }

  return (
    <DatabaseContext.Provider
      value={{
        id: database.id,
        name: database.name,
        fields: database.fields,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
