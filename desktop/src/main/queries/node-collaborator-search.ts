import { NodeCollaboratorSearchQueryInput } from '@/types/queries/node-collaborator-search';
import { databaseContext } from '@/main/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/schemas/workspace';
import { NodeTypes } from '@/lib/constants';
import { NodeCollaboratorNode } from '@/types/nodes';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class NodeCollaboratorSearchQueryHandler
  implements QueryHandler<NodeCollaboratorSearchQueryInput>
{
  public async handleQuery(
    input: NodeCollaboratorSearchQueryInput,
  ): Promise<QueryResult<NodeCollaboratorSearchQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildCollaboratorNodes(rows),
      state: {
        rows: rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: NodeCollaboratorSearchQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<NodeCollaboratorSearchQueryInput>> {
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

    const rows = await this.fetchNodes(input);
    if (isEqual(rows, state.rows)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildCollaboratorNodes(rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: NodeCollaboratorSearchQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
      SELECT n.*
      FROM nodes n
      JOIN node_names nn ON n.id = nn.id
      WHERE n.type = ${NodeTypes.User}
        AND nn.name MATCH ${input.searchQuery + '*'}
        ${
          input.excluded.length > 0
            ? sql`AND n.id NOT IN (${sql.join(
                input.excluded.map((id) => sql`${id}`),
                sql`, `,
              )})`
            : sql``
        }
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildCollaboratorNodes = (
    rows: SelectNode[],
  ): NodeCollaboratorNode[] => {
    return rows.map((row) => {
      const attributes = JSON.parse(row.attributes);
      return {
        id: row.id,
        name: attributes.name,
        email: attributes.email,
        avatar: attributes.avatar,
        role: 'collaborator',
      };
    });
  };
}
