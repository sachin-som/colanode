import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { LocalNode } from '@/types/nodes';
import { SidebarNode, SidebarSpaceNode } from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export const useSidebarSpacesQuery = () => {
  const workspace = useWorkspace();

  return useQuery<QueryResult<SelectNode>, Error, SidebarSpaceNode[], string[]>(
    {
      queryKey: ['sidebar-spaces', workspace.id],
      queryFn: async ({ queryKey }) => {
        const query = sql<SelectNode>`
          WITH space_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IS NULL AND type = ${NodeTypes.Space}
          ),
          space_children_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IN (SELECT id FROM space_nodes)
          )
          SELECT * FROM space_nodes
          UNION ALL
          SELECT * FROM space_children_nodes;
      `.compile(workspace.schema);

        return await workspace.queryAndSubscribe({
          key: queryKey,
          query,
        });
      },
      select: (data: QueryResult<SelectNode>): SidebarSpaceNode[] => {
        const rows = data?.rows ?? [];
        return buildSidebarSpaceNodes(rows);
      },
    },
  );
};

const buildSidebarSpaceNodes = (rows: SelectNode[]): SidebarSpaceNode[] => {
  const nodes: LocalNode[] = rows.map(mapNode);
  const spaces: SidebarSpaceNode[] = [];

  for (const node of nodes) {
    if (node.type !== NodeTypes.Space) {
      continue;
    }

    const children = nodes.filter((n) => n.parentId === node.id);
    spaces.push(buildSpaceNode(node, children));
  }

  return spaces;
};

const buildSpaceNode = (
  node: LocalNode,
  children: LocalNode[],
): SidebarSpaceNode => {
  return {
    id: node.id,
    type: node.type,
    name: node.attributes?.name ?? null,
    avatar: node.attributes?.avatar ?? null,
    children: children.map(buildSidearNode),
  };
};

const buildSidearNode = (node: LocalNode): SidebarNode => {
  return {
    id: node.id,
    type: node.type,
    name: node.attributes.name ?? null,
    avatar: node.attributes.avatar ?? null,
  };
};
