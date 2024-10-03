import React from 'react';
import { DatabaseContext } from '@/renderer/contexts/database';
import { DatabaseNode } from '@/types/databases';

interface DatabaseProps {
  node: DatabaseNode;
  children: React.ReactNode;
}

export const Database = ({ node, children }: DatabaseProps) => {
  return (
    <DatabaseContext.Provider
      value={{
        id: node.id,
        name: node.name,
        fields: node.fields,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
