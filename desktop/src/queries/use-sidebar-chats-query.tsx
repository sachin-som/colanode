import { useWorkspace } from '@/contexts/workspace';
import { SelectNode } from '@/electron/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { mapNode } from '@/lib/nodes';
import { SidebarChatNode } from '@/types/workspaces';
import { useQuery } from '@tanstack/react-query';
import { QueryResult, sql } from 'kysely';

type ChatRow = SelectNode & {
  collaborators: string;
};

export const useSidebarChatsQuery = () => {
  const workspace = useWorkspace();

  return useQuery<QueryResult<ChatRow>, Error, SidebarChatNode[], string[]>({
    queryKey: ['sidebar-chats', workspace.id],
    queryFn: async ({ queryKey }) => {
      const query = sql<ChatRow>`
          WITH chat_nodes AS (
            SELECT *
            FROM nodes
            WHERE parent_id IS NULL AND type = ${NodeTypes.Chat}
          ),
          collaborator_nodes AS (
            SELECT *
            FROM nodes
            WHERE id IN
            (
              SELECT collaborator_id
              FROM node_collaborators
              WHERE collaborator_id != ${workspace.userId}
                AND node_id IN 
                (
                  SELECT id
                  FROM chat_nodes
                )
            )
          ),
          all_nodes AS (
            SELECT * FROM chat_nodes
            UNION ALL
            SELECT * FROM collaborator_nodes
          ),
          chat_collaborators AS (
            SELECT
                nc.node_id,
                json_group_array(nc.collaborator_id) AS collaborators
            FROM node_collaborators nc
            WHERE nc.node_id IN (SELECT id FROM chat_nodes)
              AND nc.collaborator_id != ${workspace.userId}
            GROUP BY nc.node_id
          )
          SELECT
            n.*,
              COALESCE(cc.collaborators, json('[]')) AS collaborators
          FROM all_nodes n
          LEFT JOIN chat_collaborators cc ON n.id = cc.node_id
      `.compile(workspace.schema);

      return await workspace.queryAndSubscribe({
        key: queryKey,
        query,
      });
    },
    select: (data: QueryResult<ChatRow>): SidebarChatNode[] => {
      const rows = data?.rows ?? [];
      return buildSidebarSpaceNodes(rows);
    },
  });
};

const buildSidebarSpaceNodes = (rows: ChatRow[]): SidebarChatNode[] => {
  const chats: SidebarChatNode[] = [];

  for (const row of rows) {
    if (row.type !== NodeTypes.Chat) {
      continue;
    }

    const chatNode = mapNode(row);
    const collaboratorIds = JSON.parse(row.collaborators) as string[];
    if (!collaboratorIds || collaboratorIds.length === 0) {
      continue;
    }

    const collaboratorId = collaboratorIds[0];
    const collaboratorRow = rows.find((r) => r.id === collaboratorId);
    if (!collaboratorRow) {
      continue;
    }

    const collaboratorNode = mapNode(collaboratorRow);
    chats.push({
      id: chatNode.id,
      type: chatNode.type,
      name: collaboratorNode.attributes.name,
      avatar: chatNode.attributes.avatar,
    });
  }

  return chats;
};
