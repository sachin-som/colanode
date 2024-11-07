import { NodeCollaboratorListQueryInput } from '@/operations/queries/node-collaborator-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  InheritNodeCollaboratorsGroup,
  NodeCollaboratorsWrapper,
  NodeCollaborator,
} from '@/types/nodes';
import { NodeAttributes } from '@colanode/core';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash';

type ExtractedNodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};

type NodeWithAttributesRow = {
  id: string;
  attributes: string;
};

export class NodeCollaboratorListQueryHandler
  implements QueryHandler<NodeCollaboratorListQueryInput>
{
  public async handleQuery(
    input: NodeCollaboratorListQueryInput
  ): Promise<QueryResult<NodeCollaboratorListQueryInput>> {
    const ancestors = await this.fetchAncestors(input);
    const extractedCollaborators = this.extractCollaborators(ancestors);
    const collaboratorIds = extractedCollaborators.map(
      (collaborator) => collaborator.collaboratorId
    );

    const collaboratorNodes = await this.fetchCollaborators(
      input,
      collaboratorIds
    );

    return {
      output: this.buildNodeCollaborators(
        input.nodeId,
        ancestors,
        collaboratorNodes,
        extractedCollaborators
      ),
      state: {
        ancestors,
        extractedCollaborators,
        collaboratorNodes,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeCollaboratorListQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<NodeCollaboratorListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          change.table === 'nodes' &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const ancestors = await this.fetchAncestors(input);
    const extractedCollaborators = this.extractCollaborators(ancestors);
    const collaboratorIds = extractedCollaborators.map(
      (collaborator) => collaborator.collaboratorId
    );

    const collaboratorNodes = await this.fetchCollaborators(
      input,
      collaboratorIds
    );

    if (
      isEqual(ancestors, state.ancestors) &&
      isEqual(extractedCollaborators, state.extractedCollaborators) &&
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
          ancestors,
          collaboratorNodes,
          extractedCollaborators
        ),
        state: {
          ancestors,
          extractedCollaborators,
          collaboratorNodes,
        },
      },
    };
  }

  private async fetchAncestors(
    input: NodeCollaboratorListQueryInput
  ): Promise<NodeWithAttributesRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const result = await workspaceDatabase
      .selectFrom('nodes')
      .select(['nodes.id', 'nodes.attributes'])
      .innerJoin('node_paths', 'nodes.id', 'node_paths.ancestor_id')
      .where('node_paths.descendant_id', '=', input.nodeId)
      .orderBy('node_paths.level', 'desc')
      .execute();

    return result;
  }

  private extractCollaborators(
    nodes: NodeWithAttributesRow[]
  ): ExtractedNodeCollaborator[] {
    const map: Map<string, ExtractedNodeCollaborator> = new Map();

    for (const node of nodes) {
      const attributes = JSON.parse(node.attributes) as NodeAttributes;

      if (
        attributes.type !== 'space' &&
        attributes.type !== 'channel' &&
        attributes.type !== 'chat' &&
        attributes.type !== 'database' &&
        attributes.type !== 'page'
      ) {
        continue;
      }

      const collaborators = attributes.collaborators;
      if (!collaborators) {
        continue;
      }

      const collaboratorIds = Object.keys(collaborators);
      for (const collaboratorId of collaboratorIds) {
        map.set(collaboratorId, {
          nodeId: node.id,
          collaboratorId,
          role: collaborators[collaboratorId],
        });
      }
    }

    return Array.from(map.values());
  }

  private async fetchCollaborators(
    input: NodeCollaboratorListQueryInput,
    collaboratorIds: string[]
  ): Promise<NodeWithAttributesRow[]> {
    if (collaboratorIds.length === 0) {
      return [];
    }

    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
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
    ancestors: NodeWithAttributesRow[],
    collaboratorNodes: NodeWithAttributesRow[],
    extractedCollaborators: ExtractedNodeCollaborator[]
  ): NodeCollaboratorsWrapper => {
    const direct: NodeCollaborator[] = [];
    const inherit: InheritNodeCollaboratorsGroup[] = [];

    const inheritCollaboratorMap: Map<string, NodeCollaborator[]> = new Map();

    for (const extractedCollaborator of extractedCollaborators) {
      const collaboratorNode = collaboratorNodes.find(
        (row) => row.id === extractedCollaborator.collaboratorId
      );

      if (!collaboratorNode) {
        continue;
      }

      const collaboratorAttributes = JSON.parse(collaboratorNode?.attributes);

      const collaborator: NodeCollaborator = {
        id: extractedCollaborator.collaboratorId,
        name: collaboratorAttributes.name,
        email: collaboratorAttributes.email,
        avatar: collaboratorAttributes.avatar || null,
        role: extractedCollaborator.role,
      };
      if (extractedCollaborator.nodeId === nodeId) {
        direct.push(collaborator);
      } else {
        if (!inheritCollaboratorMap.has(extractedCollaborator.nodeId)) {
          inheritCollaboratorMap.set(extractedCollaborator.nodeId, []);
        }

        inheritCollaboratorMap
          .get(extractedCollaborator.nodeId)
          ?.push(collaborator);
      }
    }

    for (const ancestor of ancestors.reverse()) {
      if (!inheritCollaboratorMap.has(ancestor.id)) {
        continue;
      }

      const ancestorAttributes = JSON.parse(ancestor.attributes);
      const group: InheritNodeCollaboratorsGroup = {
        id: ancestor.id,
        name: ancestorAttributes.name,
        avatar: ancestorAttributes.avatar || null,
        collaborators: inheritCollaboratorMap.get(ancestor.id) ?? [],
      };

      inherit.push(group);
    }

    return {
      direct,
      inherit,
    };
  };
}
