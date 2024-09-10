import { useWorkspace } from '@/contexts/workspace';
import { SelectNodeWithAttributes } from '@/data/schemas/workspace';
import { AttributeTypes, NodeTypes } from '@/lib/constants';
import { mapNodeWithAttributes } from '@/lib/nodes';
import { LocalNodeWithAttributes } from '@/types/nodes';
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

  return useQuery<
    QueryResult<SelectNodeWithAttributes>,
    Error,
    SidebarQueryResult,
    string[]
  >({
    queryKey: ['sidebar', workspace.id],
    queryFn: async ({ queryKey }) => {
      const query = sql<SelectNodeWithAttributes>`
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
          ),
          all_nodes AS (
            SELECT * FROM space_nodes
            UNION ALL
            SELECT * FROM space_children_nodes
            UNION ALL
            SELECT * FROM chat_nodes
          )
          SELECT 
            n.*,
            CASE 
              WHEN COUNT(na.node_id) = 0 THEN json('[]')
              ELSE json_group_array(
                json_object(
                  'node_id', na.'node_id',
                  'type', na.'type',
                  'key', na.'key',
                  'text_value', na.'text_value',
                  'number_value', na.'number_value',
                  'foreign_node_id', na.'foreign_node_id',
                  'created_at', na.'created_at',
                  'updated_at', na.'updated_at',
                  'created_by', na.'created_by',
                  'updated_by', na.'updated_by',
                  'version_id', na.'version_id',
                  'server_created_at', na.'server_created_at',
                  'server_updated_at', na.'server_updated_at',
                  'server_version_id', na.'server_version_id'
                )
              )
            END as attributes
          FROM all_nodes n
          LEFT JOIN node_attributes na ON n.id = na.node_id
          GROUP BY n.id;
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (
      data: QueryResult<SelectNodeWithAttributes>,
    ): SidebarQueryResult => {
      const rows = data?.rows ?? [];
      return buildSidebarNodes(rows);
    },
  });
};

const buildSidebarNodes = (
  rows: SelectNodeWithAttributes[],
): SidebarQueryResult => {
  const nodes: LocalNodeWithAttributes[] = rows.map(mapNodeWithAttributes);

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
  node: LocalNodeWithAttributes,
  children: LocalNodeWithAttributes[],
): SidebarSpaceNode => {
  const name = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Name,
  )?.textValue;

  const avatar = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Avatar,
  )?.textValue;

  return {
    id: node.id,
    type: node.type,
    name: name ?? null,
    avatar: avatar ?? null,
    children: children.map(buildSidearNode),
  };
};

const buildSidearNode = (node: LocalNodeWithAttributes): SidebarNode => {
  const name = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Name,
  )?.textValue;

  const avatar = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Avatar,
  )?.textValue;

  return {
    id: node.id,
    type: node.type,
    name: name ?? null,
    avatar: avatar ?? null,
  };
};

const buildChatNode = (node: LocalNodeWithAttributes): SidebarChatNode => {
  const name = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Name,
  )?.textValue;

  const avatar = node.attributes.find(
    (attr) => attr.type === AttributeTypes.Avatar,
  )?.textValue;

  return {
    id: node.id,
    type: node.type,
    name: name ?? null,
    avatar: avatar ?? null,
  };
};
