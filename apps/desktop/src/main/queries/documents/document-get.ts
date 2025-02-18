import { YDoc } from '@colanode/crdt';

import { Document } from '@/shared/types/documents';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { Event } from '@/shared/types/events';
import { WorkspaceQueryHandlerBase } from '@/main/queries/workspace-query-handler-base';
import { DocumentGetQueryInput } from '@/shared/queries/documents/document-get';

export class DocumentGetQueryHandler
  extends WorkspaceQueryHandlerBase
  implements QueryHandler<DocumentGetQueryInput>
{
  public async handleQuery(
    input: DocumentGetQueryInput
  ): Promise<Document | null> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const document = await workspace.database
      .selectFrom('documents')
      .selectAll()
      .where('id', '=', input.documentId)
      .executeTakeFirst();

    const documentUpdates = await workspace.database
      .selectFrom('document_updates')
      .selectAll()
      .where('document_id', '=', input.documentId)
      .orderBy('id', 'asc')
      .execute();

    if (documentUpdates.length === 0) {
      if (!document) {
        return null;
      }

      return {
        id: document.id,
        revision: document.revision,
        state: document.state,
        createdAt: document.created_at,
        createdBy: document.created_by,
        updatedAt: document.updated_at,
        updatedBy: document.updated_by,
      };
    }

    const ydoc = new YDoc(document?.state);
    for (const update of documentUpdates) {
      ydoc.applyUpdate(update.data);
    }

    const firstUpdate = documentUpdates[0]!;
    const lastUpdate = documentUpdates[documentUpdates.length - 1]!;

    return {
      id: input.documentId,
      revision: 0n,
      state: ydoc.getState(),
      createdAt: firstUpdate.created_at,
      createdBy: workspace.userId,
      updatedAt: lastUpdate.created_at,
      updatedBy: workspace.userId,
    };
  }

  public async checkForChanges(
    event: Event,
    input: DocumentGetQueryInput,
    _: Document | null
  ): Promise<ChangeCheckResult<DocumentGetQueryInput>> {
    if (
      event.type === 'workspace_deleted' &&
      event.workspace.accountId === input.accountId &&
      event.workspace.id === input.workspaceId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    if (
      event.type === 'document_updated' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentId === input.documentId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'document_update_created' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentId === input.documentId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'document_update_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.documentId === input.documentId
    ) {
      const newOutput = await this.handleQuery(input);
      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (
      event.type === 'node_deleted' &&
      event.accountId === input.accountId &&
      event.workspaceId === input.workspaceId &&
      event.node.id === input.documentId
    ) {
      return {
        hasChanges: true,
        result: null,
      };
    }

    return {
      hasChanges: false,
    };
  }
}
