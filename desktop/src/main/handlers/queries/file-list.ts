import { FileListQueryInput } from '@/operations/queries/file-list';
import { databaseManager } from '@/main/data/database-manager';
import {
  ChangeCheckResult,
  QueryHandler,
  QueryResult,
} from '@/operations/queries';
import { MutationChange } from '@/operations/mutations';
import { NodeTypes } from '@/lib/constants';
import { compareString } from '@/lib/utils';
import { isEqual } from 'lodash';
import { FileNode } from '@/types/files';

interface FileRow {
  id: string;
  attributes: string;
  parent_id: string | null;
  type: string;
  download_progress?: number | null;
  created_at: string;
  created_by: string;
}

export class FileListQueryHandler implements QueryHandler<FileListQueryInput> {
  public async handleQuery(
    input: FileListQueryInput,
  ): Promise<QueryResult<FileListQueryInput>> {
    const files = await this.fetchFiles(input);

    return {
      output: this.buildFiles(files),
      state: {
        files,
      },
    };
  }

  public async checkForChanges(
    changes: MutationChange[],
    input: FileListQueryInput,
    state: Record<string, any>,
  ): Promise<ChangeCheckResult<FileListQueryInput>> {
    if (
      !changes.some(
        (change) =>
          change.type === 'workspace' &&
          (change.table === 'nodes' || change.table === 'downloads') &&
          change.userId === input.userId,
      )
    ) {
      return {
        hasChanges: false,
      };
    }

    const files = await this.fetchFiles(input);
    if (isEqual(files, state.files)) {
      return {
        hasChanges: false,
      };
    }

    return {
      hasChanges: true,
      result: {
        output: this.buildFiles(files),
        state: {
          files,
        },
      },
    };
  }

  private async fetchFiles(input: FileListQueryInput): Promise<FileRow[]> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      input.userId,
    );

    const offset = input.page * input.count;
    const files = await workspaceDatabase
      .selectFrom('nodes')
      .leftJoin('downloads', (join) =>
        join.onRef('nodes.id', '=', 'downloads.node_id'),
      )
      .select([
        'nodes.id',
        'nodes.attributes',
        'nodes.parent_id',
        'nodes.type',
        'downloads.progress as download_progress',
        'nodes.created_at',
        'nodes.created_by',
      ])
      .where((eb) =>
        eb.and([
          eb('parent_id', '=', input.parentId),
          eb('type', '=', NodeTypes.File),
        ]),
      )
      .orderBy('id', 'asc')
      .limit(input.count)
      .offset(offset)
      .execute();

    return files;
  }

  private buildFiles = (fileRows: FileRow[]): FileNode[] => {
    const files: FileNode[] = [];
    for (const fileRow of fileRows) {
      const attributes = JSON.parse(fileRow.attributes);
      files.push({
        id: fileRow.id,
        name: attributes.name,
        mimeType: attributes.mimeType,
        size: attributes.size,
        extension: attributes.extension,
        fileName: attributes.fileName,
        createdAt: fileRow.created_at,
        downloadProgress: fileRow.download_progress,
      });
    }

    return files.sort((a, b) => compareString(a.id, b.id));
  };
}
