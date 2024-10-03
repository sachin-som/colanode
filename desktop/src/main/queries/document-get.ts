import { DocumentGetQueryInput } from '@/types/queries/document-get';
import { databaseContext } from '@/main/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { sql } from 'kysely';
import { SelectNode } from '@/main/schemas/workspace';
import { mapNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { LocalNode } from '@/types/nodes';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class DocumentGetQueryHandler
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput,
  ): Promise<QueryResult<DocumentGetQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: {
        nodes: this.buildMap(rows),
      },
      state: {
        rows,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: DocumentGetQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<DocumentGetQueryInput>> {
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
        output: {
          nodes: this.buildMap(rows),
        },
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: DocumentGetQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
      WITH RECURSIVE document_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${input.nodeId}
          
          UNION ALL
          
          SELECT child.*
          FROM nodes child
          INNER JOIN document_nodes parent ON child.parent_id = parent.id
          WHERE parent.type NOT IN (${NodeTypes.Page})
      )
      SELECT *
      FROM document_nodes
    `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildMap = (rows: SelectNode[]): Map<string, LocalNode> => {
    const map = new Map<string, LocalNode>();
    rows.forEach((row) => {
      map.set(row.id, mapNode(row));
    });
    return map;
  };
}
