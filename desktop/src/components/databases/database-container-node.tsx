import React from 'react';
import { LocalNode } from '@/types/nodes';
import { DatabaseContext } from '@/contexts/database';
import { DatabaseViews } from './database-views';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabaseQuery } from '@/queries/use-database-query';

interface DatabaseContainerNodeProps {
  node: LocalNode;
}

export const DatabaseContainerNode = ({ node }: DatabaseContainerNodeProps) => {
  const { data, isPending } = useDatabaseQuery(node.id);

  if (isPending) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <DatabaseContext.Provider
      value={{ id: node.id, name: data?.name, fields: data?.fields }}
    >
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <DatabaseViews key={node.id} views={data.views} />
      </ScrollArea>
    </DatabaseContext.Provider>
  );
};
