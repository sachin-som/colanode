import { NodeCollaboratorListQueryInput } from '@/operations/queries/node-collaborator-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { sql } from 'kysely';
import { NodeTypes } from '@/lib/constants';
import {
  InheritNodeCollaboratorsGroup,
  NodeCollaboratorNode,
  NodeCollaboratorsWrapper,
} from '@/types/nodes';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';

type NodeCollaboratorRow = {
  node_id: string;
  node_level: number;
  node_attributes: string;
  node_parent_id: string | null;
  collaborator_id: string;
  collaborator_attributes: string;
  role: string;
};

export class NodeCollaboratorListQueryHandler
  implements QueryHandler<NodeCollaboratorListQueryInput>
{
  public async handleQuery(
    input: NodeCollaboratorListQueryInput,
  ): Promise<QueryResult<NodeCollaboratorListQueryInput>> {
    const rows = await this.fetchCollaborators(input);
    return {
      output: this.buildNodeCollaborators(input.nodeId, rows),
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeCollaboratorListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<NodeCollaboratorListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const rows = await this.fetchCollaborators(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildNodeCollaborators(input.nodeId, rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchCollaborators(
    input: NodeCollaboratorListQueryInput,
  ): Promise<NodeCollaboratorRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<NodeCollaboratorRow>`
      WITH RECURSIVE ancestors(id, parent_id, level) AS (
        SELECT id, parent_id, 0 AS level
        FROM nodes
        WHERE id = ${input.nodeId}
        UNION ALL
        SELECT n.id, n.parent_id, a.level + 1
        FROM nodes n
        INNER JOIN ancestors a ON n.id = a.parent_id
      )
      SELECT
        nc.node_id,
        a.level AS node_level,
        nn.attributes AS node_attributes,
        nn.parent_id AS node_parent_id,
        nc.collaborator_id,
        cn.attributes AS collaborator_attributes,
        nc.role
      FROM node_collaborators nc
      JOIN ancestors a ON nc.node_id = a.id
      JOIN nodes nn ON nc.node_id = nn.id
      JOIN nodes cn ON nc.collaborator_id = cn.id
      WHERE cn.type = ${NodeTypes.User};
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildNodeCollaborators = (
    nodeId: string,
    rows: NodeCollaboratorRow[],
  ): NodeCollaboratorsWrapper => {
    const direct: NodeCollaboratorNode[] = [];
    const inheritCollaboratorMap: Map<string, NodeCollaboratorRow> = new Map();

    for (const row of rows) {
      if (row.node_id === nodeId) {
        const collaboratorAttributes = JSON.parse(row.collaborator_attributes);

        const collaborator: NodeCollaboratorNode = {
          id: row.collaborator_id,
          name: collaboratorAttributes.name,
          email: collaboratorAttributes.email,
          avatar: collaboratorAttributes.avatar || null,
          role: row.role,
        };

        direct.push(collaborator);
      } else {
        if (!inheritCollaboratorMap.has(row.collaborator_id)) {
          inheritCollaboratorMap.set(row.collaborator_id, row);
        } else {
          const existingRow = inheritCollaboratorMap.get(row.collaborator_id);
          if (!existingRow || existingRow.node_level < row.node_level) {
            inheritCollaboratorMap.set(row.collaborator_id, row);
          }
        }
      }
    }

    const inheritLeveledMap: Map<number, InheritNodeCollaboratorsGroup> =
      new Map();

    for (const row of inheritCollaboratorMap.values()) {
      if (!inheritLeveledMap.has(row.node_level)) {
        const nodeAttributes = JSON.parse(row.node_attributes);
        inheritLeveledMap.set(row.node_level, {
          id: row.node_id,
          name: nodeAttributes.name,
          avatar: nodeAttributes.avatar,
          collaborators: [],
        });
      }

      const group = inheritLeveledMap.get(row.node_level);
      const collaboratorAttributes = JSON.parse(row.collaborator_attributes);
      group.collaborators.push({
        id: row.collaborator_id,
        name: collaboratorAttributes.name,
        avatar: collaboratorAttributes.avatar,
        email: collaboratorAttributes.email,
        role: row.role,
      });
    }

    return {
      direct,
      inherit: Array.from(inheritLeveledMap.values()),
    };
  };
}
