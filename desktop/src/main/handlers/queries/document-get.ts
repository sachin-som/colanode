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
import { MutationChange } from '@/operations/mutations';
import { NodeAttributes } from '@/registry';
import { mapBlocksToContents } from '@/lib/editor';

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
  ): Promise<SelectNode | undefined> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    return workspaceDatabase
      .selectFrom('nodes')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();
  }

  private buildOutput(
    document: SelectNode | null | undefined,
  ): DocumentGetQueryOutput {
    if (!document) {
      return {
        content: null,
        hash: null,
      };
    }

    const attributes = JSON.parse(document.attributes) as NodeAttributes;
    if (attributes.type !== 'page' && attributes.type !== 'record') {
      return {
        content: null,
        hash: null,
      };
    }

    const nodeBlocks = Object.values(attributes.content ?? {});
    const contents = mapBlocksToContents(document.id, nodeBlocks);

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
