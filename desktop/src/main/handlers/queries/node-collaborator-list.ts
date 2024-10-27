import { NodeCollaboratorListQueryInput } from '@/operations/queries/node-collaborator-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { sql } from 'kysely';
import {
  InheritNodeCollaboratorsGroup,
  LocalNodeAttributes,
  NodeCollaboratorNode,
  NodeCollaboratorsWrapper,
} from '@/types/nodes';
import { MutationChange } from '@/operations/mutations';
import { isEqual } from 'lodash';

type NodeRow = {
  id: string;
  attributes: string;
  parent_id: string | null;
  level: number;
};

type NodeCollaboratorWithRole = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};

type CollaboratorNodeRow = {
  id: string;
  attributes: string;
};

export class NodeCollaboratorListQueryHandler
  implements QueryHandler<NodeCollaboratorListQueryInput>
{
  public async handleQuery(
    input: NodeCollaboratorListQueryInput,
  ): Promise<QueryResult<NodeCollaboratorListQueryInput>> {
    const nodes = await this.fetchAncestors(input);
    const collaboratorsWithRoles = this.extractCollaborators(nodes);
    const collaboratorIds = collaboratorsWithRoles.map(
      (collaborator) => collaborator.collaboratorId,
    );
    const collaboratorNodes = await this.fetchCollaborators(
      input,
      collaboratorIds,
    );

    return {
      output: this.buildNodeCollaborators(
        input.nodeId,
        nodes,
        collaboratorNodes,
        collaboratorsWithRoles,
      ),
      state: {
        nodes,
        collaboratorsWithRoles,
        collaboratorNodes,
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

    const nodes = await this.fetchAncestors(input);
    const collaboratorsWithRoles = this.extractCollaborators(nodes);
    const collaboratorIds = collaboratorsWithRoles.map(
      (collaborator) => collaborator.collaboratorId,
    );
    const collaboratorNodes = await this.fetchCollaborators(
      input,
      collaboratorIds,
    );

    if (
      isEqual(nodes, state.nodes) &&
      isEqual(collaboratorsWithRoles, state.collaboratorsWithRoles) &&
      isEqual(collaboratorNodes, state.collaboratorNodes)
    ) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildNodeCollaborators(
          input.nodeId,
          nodes,
          collaboratorNodes,
          collaboratorsWithRoles,
        ),
        state: {
          nodes,
          collaboratorsWithRoles,
          collaboratorNodes,
        },
      },
    };
  }

  private async fetchAncestors(
    input: NodeCollaboratorListQueryInput,
  ): Promise<NodeRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<NodeRow>`
      WITH RECURSIVE ancestors(id, attributes, parent_id, level) AS (
        SELECT id, attributes, parent_id, 0 AS level
        FROM nodes
        WHERE id = ${input.nodeId}
        UNION ALL
        SELECT n.id, n.attributes, n.parent_id, a.level + 1
        FROM nodes n
        INNER JOIN ancestors a ON n.id = a.parent_id
      )
      SELECT id, attributes, parent_id, level
      FROM ancestors
      ORDER BY level DESC;
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private extractCollaborators(nodes: NodeRow[]): NodeCollaboratorWithRole[] {
    const extractedCollaborators: NodeCollaboratorWithRole[] = [];

    for (const node of nodes) {
      const attributes = JSON.parse(node.attributes) as LocalNodeAttributes;
      const collaborators = attributes.collaborators;
      if (!collaborators) {
        continue;
      }

      const collaboratorIds = Object.keys(collaborators);
      for (const collaboratorId of collaboratorIds) {
        extractedCollaborators.push({
          nodeId: node.id,
          collaboratorId,
          role: collaborators[collaboratorId],
        });
      }
    }

    return extractedCollaborators;
  }

  private async fetchCollaborators(
    input: NodeCollaboratorListQueryInput,
    collaboratorIds: string[],
  ): Promise<CollaboratorNodeRow[]> {
    if (collaboratorIds.length === 0) {
      return [];
    }

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const result = await workspaceDatabase
      .selectFrom('nodes')
      .select(['id', 'attributes'])
      .where('id', 'in', collaboratorIds)
      .execute();

    return result;
  }

  private buildNodeCollaborators = (
    nodeId: string,
    nodes: NodeRow[],
    collaboratorNodes: CollaboratorNodeRow[],
    collaboratorsWithRoles: NodeCollaboratorWithRole[],
  ): NodeCollaboratorsWrapper => {
    const direct: NodeCollaboratorNode[] = [];
    const inheritCollaboratorMap: Map<string, NodeCollaboratorWithRole> =
      new Map();

    for (const collaboratorWithRole of collaboratorsWithRoles) {
      if (collaboratorWithRole.nodeId === nodeId) {
        const collaboratorAttributes = JSON.parse(
          collaboratorNodes.find(
            (row) => row.id === collaboratorWithRole.collaboratorId,
          )?.attributes,
        );

        const collaborator: NodeCollaboratorNode = {
          id: collaboratorWithRole.collaboratorId,
          name: collaboratorAttributes.name,
          email: collaboratorAttributes.email,
          avatar: collaboratorAttributes.avatar || null,
          role: collaboratorWithRole.role,
        };

        direct.push(collaborator);
      } else {
        if (!inheritCollaboratorMap.has(collaboratorWithRole.collaboratorId)) {
          inheritCollaboratorMap.set(collaboratorWithRole.collaboratorId, {
            nodeId: collaboratorWithRole.nodeId,
            collaboratorId: collaboratorWithRole.collaboratorId,
            role: collaboratorWithRole.role,
          });
        } else {
          const existingRow = inheritCollaboratorMap.get(
            collaboratorWithRole.collaboratorId,
          );
          if (
            !existingRow ||
            existingRow.nodeId !== collaboratorWithRole.nodeId
          ) {
            inheritCollaboratorMap.set(
              collaboratorWithRole.collaboratorId,
              collaboratorWithRole,
            );
          }
        }
      }
    }

    const inheritLeveledMap: Map<number, InheritNodeCollaboratorsGroup> =
      new Map();

    for (const collaboratorWithRole of inheritCollaboratorMap.values()) {
      if (
        direct.some(
          (collaborator) =>
            collaborator.id === collaboratorWithRole.collaboratorId,
        )
      ) {
        continue;
      }

      const nodeLevel = nodes.find(
        (node) => node.id === collaboratorWithRole.nodeId,
      )?.level;

      if (nodeLevel === undefined) {
        continue;
      }

      if (!inheritLeveledMap.has(nodeLevel)) {
        const nodeAttributes = JSON.parse(
          nodes.find((node) => node.id === collaboratorWithRole.nodeId)
            ?.attributes,
        );
        inheritLeveledMap.set(nodeLevel, {
          id: collaboratorWithRole.nodeId,
          name: nodeAttributes.name,
          avatar: nodeAttributes.avatar,
          collaborators: [],
        });
      }

      const group = inheritLeveledMap.get(nodeLevel);
      const collaboratorAttributes = JSON.parse(
        collaboratorNodes.find(
          (row) => row.id === collaboratorWithRole.collaboratorId,
        )?.attributes,
      );
      group.collaborators.push({
        id: collaboratorWithRole.collaboratorId,
        name: collaboratorAttributes.name,
        avatar: collaboratorAttributes.avatar,
        email: collaboratorAttributes.email,
        role: collaboratorWithRole.role,
      });
    }

    return {
      direct,
      inherit: Array.from(inheritLeveledMap.values()),
    };
  };
}
