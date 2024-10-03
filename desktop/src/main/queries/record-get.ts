import { RecordGetQueryInput } from '@/types/queries/record-get';
import { databaseContext } from '@/main/data/database-context';
import { ChangeCheckResult, QueryHandler, QueryResult } from '@/types/queries';
import { mapNode } from '@/lib/nodes';
import { sql } from 'kysely';
import { SelectNode } from '@/main/data/workspace/schema';
import { RecordNode } from '@/types/databases';
import { NodeTypes } from '@/lib/constants';
import { MutationChange } from '@/types/mutations';
import { isEqual } from 'lodash';

export class RecordGetQueryHandler
  implements QueryHandler<RecordGetQueryInput>
{
  async handleQuery(
    input: RecordGetQueryInput,
  ): Promise<QueryResult<RecordGetQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildRecord(input.recordId, rows),
      state: {
        rows,
      },
    };
  }

  async checkForChanges(
    changes: MutationChange[],
    input: RecordGetQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<RecordGetQueryInput>> {
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
        output: this.buildRecord(input.recordId, rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(input: RecordGetQueryInput): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseContext.getWorkspaceDatabase(
      input.userId,
    );

    if (workspaceDatabase === null) {
      throw new Error('Workspace database not found.');
    }

    const query = sql<SelectNode>`
      WITH record_node AS (
        SELECT *
        FROM nodes
        WHERE id = ${input.recordId}
      ),
      author_node AS (
        SELECT *
        FROM nodes
        WHERE id IN (SELECT DISTINCT created_by FROM record_node)
      )
      SELECT * FROM record_node
      UNION ALL
      SELECT * FROM author_node
      `.compile(workspaceDatabase);

    const result = await workspaceDatabase.executeQuery(query);
    return result.rows;
  }

  private buildRecord = (
    recordId: string,
    rows: SelectNode[],
  ): RecordNode | null => {
    const nodes = rows.map(mapNode);
    const recordNode = nodes.find((node) => node.id === recordId);
    if (!recordNode) {
      return null;
    }

    const recordName = recordNode.attributes.name;
    const authorNode = nodes.find((node) => node.type === NodeTypes.User);
    const author = authorNode
      ? {
          id: authorNode.id,
          name: authorNode.attributes.name,
          avatar: authorNode.attributes.avatar,
          email: authorNode.attributes.email,
        }
      : {
          id: recordNode.createdBy,
          name: 'Unknown User',
          avatar: null,
          email: 'unknown@neuron.com',
        };

    return {
      id: recordNode.id,
      parentId: recordNode.parentId,
      name: recordName ?? null,
      index: recordNode.index,
      attributes: recordNode.attributes,
      createdAt: new Date(recordNode.createdAt),
      createdBy: author,
      versionId: recordNode.versionId,
    };
  };
}
