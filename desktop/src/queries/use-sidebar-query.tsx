import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/data/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { LocalNode } from '@/types/nodes';
import {
  SidebarChatNode,
  SidebarNode,
  SidebarSpaceNode,
} from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

export type SidebarQueryResult = {
  spaces: SidebarSpaceNode[];
  chats: SidebarChatNode[];
};

export const useSidebarQuery = () => {
  const workspace = useWorkspace();

  return useQuery<QueryResult<SelectNode>, Error, SidebarQueryResult, string[]>(
    {
      queryKey: ['sidebar', workspace.id],
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
          ),
          chat_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IS NULL AND type = ${NodeTypes.Chat}
          )
          SELECT * FROM space_nodes
          UNION ALL
          SELECT * FROM space_children_nodes
          UNION ALL
          SELECT * FROM chat_nodes;
      `.compile(workspace.schema);

        return await workspace.queryAndSubscribe({
          key: queryKey,
          query,
        });
      },
      select: (data: QueryResult<SelectNode>): SidebarQueryResult => {
        const rows = data?.rows ?? [];
        return buildSidebarNodes(rows);
      },
    },
  );
};

const buildSidebarNodes = (rows: SelectNode[]): SidebarQueryResult => {
  const nodes: LocalNode[] = rows.map(mapNode);

  const spaces: SidebarSpaceNode[] = [];
  const chats: SidebarChatNode[] = [];

  for (const node of nodes) {
    if (node.type === NodeTypes.Space) {
      const children = nodes.filter((n) => n.parentId === node.id);
      spaces.push(buildSpaceNode(node, children));
    } else if (node.type === NodeTypes.Chat) {
      chats.push(buildChatNode(node));
    }
  }

  return {
    spaces,
    chats,
  };
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

const buildChatNode = (node: LocalNode): SidebarChatNode => {
  return {
    id: node.id,
    type: node.type,
    name: node.attributes.name ?? null,
    avatar: node.attributes.avatar ?? null,
  };
};
