import { FileGetQueryInput } from '@/operations/queries/file-get';
import { databaseManager } from '@/main/data/database-manager';
import {
  MutationChange,
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/main/types';
import { isEqual } from 'lodash-es';
import { FileDetails } from '@/types/files';

interface FileRow {
  id: string;
  attributes: string;
  parent_id: string | null;
  type: string;
  download_progress?: number | null;
  created_at: string;
  created_by: string;
  created_by_attributes: string | null;
}

export class FileGetQueryHandler implements QueryHandler<FileGetQueryInput> {
  public async handleQuery(
    input: FileGetQueryInput
  ): Promise<QueryResult<FileGetQueryInput>> {
    const row = await this.fetchFile(input);

    return {
      output: row ? this.buildFile(row) : null,
      state: {
        row,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: FileGetQueryInput,
    state: Record<string, any>
  ): Promise<ChangeCheckResult<FileGetQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'downloads') &&
          change.userId === input.userId
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const row = await this.fetchFile(input);
    if (isEqual(row, state.row)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: row ? this.buildFile(row) : null,
        state: {
          row,
        },
      },
    };
  }

  private async fetchFile(
    input: FileGetQueryInput
  ): Promise<FileRow | undefined> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId
    );

    const row = await workspaceDatabase
      .selectFrom('nodes as file')
      .leftJoin('downloads as file_downloads', (join) =>
        join.onRef('file.id', '=', 'file_downloads.node_id')
      )
      .leftJoin('nodes as created_by', (join) =>
        join.onRef('file.created_by', '=', 'created_by.id')
      )
      .select([
        'file.id',
        'file.parent_id',
        'file.type',
        'file.attributes',
        'file_downloads.progress as download_progress',
        'file.created_at',
        'file.created_by',
        'created_by.attributes as created_by_attributes',
      ])
      .where('file.id', '=', input.fileId)
      .executeTakeFirst();

    return row;
  }

  private buildFile(row: FileRow): FileDetails {
    const attributes = JSON.parse(row.attributes);
    const createdByAttributes = row.created_by_attributes
      ? JSON.parse(row.created_by_attributes)
      : null;

    return {
      id: row.id,
      name: attributes.name,
      mimeType: attributes.mimeType,
      size: attributes.size,
      extension: attributes.extension,
      fileName: attributes.fileName,
      downloadProgress: row.download_progress,
      createdAt: row.created_at,
      createdBy: {
        id: row.created_by,
        name: createdByAttributes.name,
        avatar: createdByAttributes.avatar,
        email: createdByAttributes.email,
      },
    };
  }
}
