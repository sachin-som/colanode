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
import { MutationChange } from '@/operations/mutations';

export class DocumentGetQueryHandler
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput,
  ): Promise<QueryResult<DocumentGetQueryInput>> {
    const document = await this.fetchDocument(input);
    return {
      output: this.buildOutput(document),
      state: {
        document,
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

    const document = await this.fetchDocument(input);
    if (isEqual(document, state.document)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildOutput(document),
        state: {
          document,
        },
      },
    };
  }

  private async fetchDocument(
    input: DocumentGetQueryInput,
  ): Promise<SelectNode | null> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    return workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();
  }

  private buildOutput(document: SelectNode | null): DocumentGetQueryOutput {
    const node = mapNode(document);
    const contents = node.attributes?.content ?? [];
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
