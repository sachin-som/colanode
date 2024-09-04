import React from 'react';
import { LocalNode } from '@/types/nodes';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace';
import { sql } from 'kysely';
import { SelectNode } from '@/data/schemas/workspace';
import { NodeTypes, ViewNodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { DatabaseContext } from '@/contexts/database';
import { DatabaseViews } from './database-views';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mapField } from '@/lib/databases';

interface DatabaseContainerNodeProps {
  node: LocalNode;
}

export const DatabaseContainerNode = ({ node }: DatabaseContainerNodeProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useQuery({
    queryKey: ['database', node.id],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNode>`
          WITH field_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${node.id} AND type = ${NodeTypes.Field}
          ),
          view_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id = ${node.id} AND type IN (${sql.join(ViewNodeTypes)})
          ),
          select_option_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN 
              (
                SELECT id
                FROM field_nodes
              )
            AND type = ${NodeTypes.SelectOption}
          )
          SELECT * FROM field_nodes
          UNION ALL
          SELECT * FROM view_nodes
          UNION ALL
          SELECT * FROM select_option_nodes;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
  });

  if (isPending) {
    return null;
  }

  const rows = data?.rows ?? [];
  const fieldNodes = rows
    .filter((row) => row.type === NodeTypes.Field)
    .map((row) => {
      const selectOptionRows =
        rows.filter(
          (selectOptionRow) =>
            selectOptionRow.type === NodeTypes.SelectOption &&
            selectOptionRow.parent_id === row.id,
        ) ?? [];
      return mapField(row, selectOptionRows);
    });

  const viewNodes = rows
    .filter((row) => ViewNodeTypes.includes(row.type))
    .map((row) => mapNode(row));

  return (
    <DatabaseContext.Provider value={{ id: node.id, fields: fieldNodes }}>
      <ScrollArea className="h-full max-h-full w-full overflow-y-auto px-10 pb-12">
        <DatabaseViews key={node.id} views={viewNodes} />
      </ScrollArea>
    </DatabaseContext.Provider>
  );
};
