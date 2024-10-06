import { sql } from 'kysely';
import { sha256 } from 'js-sha256';
import { isEqual } from 'lodash';
import {
  DocumentGetQueryInput,
  DocumentGetQueryOutput,
} from '@/operations/queries/document-get';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';

import { SelectNode } from '@/main/data/workspace/schema';
import { mapNode } from '@/lib/nodes';
import { NodeTypes } from '@/lib/constants';
import { MutationChange } from '@/operations/mutations';
import { mapNodesToContents } from '@/lib/editor';

export class DocumentGetQueryHandler
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput,
  ): Promise<QueryResult<DocumentGetQueryInput>> {
    const rows = await this.fetchNodes(input);
    return {
      output: this.buildOutput(input.documentId, rows),
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
        output: this.buildOutput(input.documentId, rows),
        state: {
          rows,
        },
      },
    };
  }

  private async fetchNodes(
    input: DocumentGetQueryInput,
  ): Promise<SelectNode[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const query = sql<SelectNode>`
      WITH RECURSIVE document_nodes AS (
          SELECT *
          FROM nodes
          WHERE parent_id = ${input.documentId}
          
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

  private buildOutput(
    documentId: string,
    rows: SelectNode[],
  ): DocumentGetQueryOutput {
    const nodes = rows.map(mapNode);
    const contents = mapNodesToContents(documentId, nodes);
    if (!contents.length) {
      contents.push({
        type: 'paragraph',
      });
    }

    const content = {
      type: 'doc',
      content: contents,
    };

    const hash = sha256(JSON.stringify(content));

    return {
      content,
      hash,
    };
  }
}
