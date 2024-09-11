import React from 'react';
import { BoardViewNode } from '@/types/databases';
import { ViewTabs } from '@/components/databases/view-tabs';

interface BoardViewProps {
  node: BoardViewNode;
}

export const BoardView = ({ node }: BoardViewProps) => {
  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
      </div>
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        board view {node.id}
      </div>
    </React.Fragment>
  );
};
