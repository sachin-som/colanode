import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateFileMutationData,
  CreateUploadOutput,
  FileStatus,
  IdType,
  SyncFileData,
  createDebugger,
  generateId,
} from '@colanode/core';
import axios from 'axios';
import ms from 'ms';

import fs from 'fs';
import path from 'path';

import {
  fetchUserStorageUsed,
  getFileMetadata,
  getWorkspaceFilesDirectoryPath,
  getWorkspaceTempFilesDirectoryPath,
} from '@/main/lib/utils';
import { mapFile, mapNode } from '@/main/lib/mappers';
import { eventBus } from '@/shared/lib/event-bus';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { EventLoop } from '@/main/lib/event-loop';
import { SelectFile, SelectNode } from '@/main/databases/workspace';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { formatBytes } from '@/shared/lib/files';

const UPLOAD_RETRIES_LIMIT = 10;
const DOWNLOAD_RETRIES_LIMIT = 10;

export class FileService {
  private readonly debug = createDebugger('desktop:service:file');
  private readonly workspace: WorkspaceService;
  private readonly filesDir: string;
  private readonly tempFilesDir: string;

  private readonly uploadsEventLoop: EventLoop;
  private readonly downloadsEventLoop: EventLoop;
  private readonly cleanupEventLoop: EventLoop;

  constructor(workspace: WorkspaceService) {
    this.workspace = workspace;
    this.filesDir = getWorkspaceFilesDirectoryPath(
      this.workspace.accountId,
      this.workspace.id
    );

    this.tempFilesDir = getWorkspaceTempFilesDirectoryPath(
      this.workspace.accountId,
      this.workspace.id
    );

    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }

    if (!fs.existsSync(this.tempFilesDir)) {
      fs.mkdirSync(this.tempFilesDir, { recursive: true });
    }

    this.uploadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      () => {
        this.uploadFiles();
      }
    );

    this.downloadsEventLoop = new EventLoop(
      ms('1 minute'),
      ms('1 second'),
      () => {
        this.downloadFiles();
      }
    );

    this.cleanupEventLoop = new EventLoop(
      ms('10 minutes'),
      ms('5 minutes'),
      () => {
        this.cleanDeletedFiles();
        this.cleanTempFiles();
      }
    );

    this.uploadsEventLoop.start();
    this.downloadsEventLoop.start();
    this.cleanupEventLoop.start();
  }

  public async createFile(
    path: string,
    id: string,
    parentId: string,
    root: SelectNode
  ): Promise<void> {
    const metadata = getFileMetadata(path);
    if (!metadata) {
      throw new MutationError(
        MutationErrorCode.FileInvalid,
        'File is invalid or could not be read.'
      );
    }

    if (metadata.size > this.workspace.maxFileSize) {
      throw new MutationError(
        MutationErrorCode.FileTooLarge,
        'The file you are trying to upload is too large. The maximum file size is ' +
          formatBytes(this.workspace.maxFileSize)
      );
    }

    const storageUsed = await fetchUserStorageUsed(
      this.workspace.database,
      this.workspace.userId
    );

    if (storageUsed + BigInt(metadata.size) > this.workspace.storageLimit) {
      throw new MutationError(
        MutationErrorCode.StorageLimitExceeded,
        'You have reached your storage limit. You have used ' +
          formatBytes(storageUsed) +
          ' and you are trying to upload a file of size ' +
          formatBytes(metadata.size) +
          '. Your storage limit is ' +
          formatBytes(this.workspace.storageLimit)
      );
    }

    this.copyFileToWorkspace(path, id, metadata.extension);

    const mutationData: CreateFileMutationData = {
      id,
      type: metadata.type,
      parentId: parentId,
      rootId: root.id,
      name: metadata.name,
      originalName: metadata.name,
      extension: metadata.extension,
      mimeType: metadata.mimeType,
      size: metadata.size,
      createdAt: new Date().toISOString(),
    };

    const createdFile = await this.workspace.database
      .transaction()
      .execute(async (tx) => {
        const createdFile = await tx
          .insertInto('files')
          .returningAll()
          .values({
            id,
            type: metadata.type,
            parent_id: parentId,
            root_id: root.id,
            name: metadata.name,
            original_name: metadata.name,
            mime_type: metadata.mimeType,
            size: metadata.size,
            extension: metadata.extension,
            created_at: new Date().toISOString(),
            created_by: this.workspace.userId,
            status: FileStatus.Pending,
            revision: 0n,
            download_status: DownloadStatus.Completed,
            download_progress: 100,
            download_retries: 0,
            upload_status: UploadStatus.Pending,
            upload_progress: 0,
            upload_retries: 0,
          })
          .executeTakeFirst();

        if (!createdFile) {
          throw new Error('Failed to create file.');
        }

        await tx
          .insertInto('mutations')
          .values({
            id: generateId(IdType.Mutation),
            type: 'create_file',
            data: JSON.stringify(mutationData),
            created_at: new Date().toISOString(),
            retries: 0,
          })
          .execute();

        return createdFile;
      });

    if (createdFile) {
      this.workspace.mutations.triggerSync();

      eventBus.publish({
        type: 'file_created',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        file: mapFile(createdFile),
      });
    }
  }

  public copyFileToWorkspace(
    filePath: string,
    fileId: string,
    fileExtension: string
  ): void {
    const destinationFilePath = this.buildFilePath(fileId, fileExtension);

    if (!fs.existsSync(this.filesDir)) {
      fs.mkdirSync(this.filesDir, { recursive: true });
    }

    this.debug(`Copying file ${filePath} to ${destinationFilePath}`);
    fs.copyFileSync(filePath, destinationFilePath);

    // check if the file is in the temp files directory. If it is in
    // temp files directory it means it has been pasted or dragged
    // therefore we need to delete it
    const fileDirectory = path.dirname(filePath);
    if (fileDirectory === this.tempFilesDir) {
      fs.rmSync(filePath);
    }
  }

  public deleteFile(id: string, extension: string): void {
    const filePath = this.buildFilePath(id, extension);

    this.debug(`Deleting file ${filePath}`);
    fs.rmSync(filePath, { force: true });
  }

  public triggerUploads(): void {
    this.uploadsEventLoop.trigger();
  }

  public triggerDownloads(): void {
    this.downloadsEventLoop.trigger();
  }

  public destroy(): void {
    this.uploadsEventLoop.stop();
    this.downloadsEventLoop.stop();
    this.cleanupEventLoop.stop();
  }

  private async uploadFiles(): Promise<void> {
    if (!this.workspace.account.server.isAvailable) {
      return;
    }

    this.debug(`Uploading files for workspace ${this.workspace.id}`);

    const uploads = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('upload_status', '=', UploadStatus.Pending)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    for (const upload of uploads) {
      await this.uploadFile(upload);
    }
  }

  private async uploadFile(file: SelectFile): Promise<void> {
    if (file.upload_retries >= UPLOAD_RETRIES_LIMIT) {
      this.debug(
        `File ${file.id} upload retries limit reached, marking as failed`
      );

      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          upload_status: UploadStatus.Failed,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }

      return;
    }

    if (file.revision === BigInt(0)) {
      // file is not synced with the server, we need to wait for the sync to complete
      return;
    }

    if (file.status === FileStatus.Ready) {
      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }

      return;
    }

    const filePath = this.buildFilePath(file.id, file.extension);

    if (!fs.existsSync(filePath)) {
      await this.workspace.database
        .deleteFrom('files')
        .where('id', '=', file.id)
        .execute();

      this.debug(`File ${file.id} not found, deleting from database`);
      return;
    }

    try {
      const { data } =
        await this.workspace.account.client.post<CreateUploadOutput>(
          `/v1/workspaces/${this.workspace.id}/files`,
          {
            fileId: file.id,
          }
        );

      const presignedUrl = data.url;
      const fileStream = fs.createReadStream(filePath);

      let lastProgress = 0;
      await axios.put(presignedUrl, fileStream, {
        headers: {
          'Content-Type': file.mime_type,
          'Content-Length': file.size,
        },
        onUploadProgress: async (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / file.size) * 100);

          if (progress >= lastProgress) {
            return;
          }

          lastProgress = progress;

          const updatedFile = await this.workspace.database
            .updateTable('files')
            .returningAll()
            .set({
              upload_progress: progress,
              updated_at: new Date().toISOString(),
            })
            .where('id', '=', file.id)
            .executeTakeFirst();

          if (!updatedFile) {
            return;
          }

          eventBus.publish({
            type: 'file_updated',
            accountId: this.workspace.accountId,
            workspaceId: this.workspace.id,
            file: mapFile(updatedFile),
          });
        },
      });

      await this.workspace.account.client.put<CompleteUploadOutput>(
        `/v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {}
      );

      const finalFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (finalFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(finalFile),
        });
      }

      this.debug(`File ${file.id} uploaded successfully`);
    } catch {
      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set((eb) => ({ upload_retries: eb('upload_retries', '+', 1) }))
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }
    }
  }

  public async downloadFiles(): Promise<void> {
    if (!this.workspace.account.server.isAvailable) {
      return;
    }

    this.debug(`Downloading files for workspace ${this.workspace.id}`);

    const downloads = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('download_status', '=', DownloadStatus.Pending)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    for (const download of downloads) {
      await this.downloadFile(download);
    }
  }

  private async downloadFile(file: SelectFile): Promise<void> {
    if (file.download_retries >= DOWNLOAD_RETRIES_LIMIT) {
      this.debug(
        `File ${file.id} download retries limit reached, marking as failed`
      );

      await this.workspace.database
        .updateTable('files')
        .set({
          download_status: DownloadStatus.Failed,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .execute();
    }

    const filePath = this.buildFilePath(file.id, file.extension);
    if (fs.existsSync(filePath)) {
      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }

      return;
    }

    try {
      const { data } =
        await this.workspace.account.client.get<CreateDownloadOutput>(
          `/v1/workspaces/${this.workspace.id}/downloads/${file.id}`,
          {}
        );

      const presignedUrl = data.url;
      const fileStream = fs.createWriteStream(filePath);
      let lastProgress = 0;

      await axios
        .get(presignedUrl, {
          responseType: 'stream',
          onDownloadProgress: async (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / file.size) * 100
            );

            if (progress <= lastProgress) {
              return;
            }

            lastProgress = progress;

            const updatedFile = await this.workspace.database
              .updateTable('files')
              .returningAll()
              .set({
                download_progress: progress,
                updated_at: new Date().toISOString(),
              })
              .where('id', '=', file.id)
              .executeTakeFirst();

            if (updatedFile) {
              eventBus.publish({
                type: 'file_updated',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                file: mapFile(updatedFile),
              });
            }
          },
        })
        .then((response) => {
          response.data.pipe(fileStream);
        });

      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }
    } catch {
      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set((eb) => ({ download_retries: eb('download_retries', '+', 1) }))
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (updatedFile) {
        eventBus.publish({
          type: 'file_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          file: mapFile(updatedFile),
        });
      }
    }
  }

  public async cleanDeletedFiles(): Promise<void> {
    this.debug(`Checking deleted files for workspace ${this.workspace.id}`);

    const fsFiles = fs.readdirSync(this.filesDir);
    while (fsFiles.length > 0) {
      const batch = fsFiles.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = path.parse(file).name;
        fileIdMap[id] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const files = await this.workspace.database
        .selectFrom('files')
        .select(['id'])
        .where('id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const file = files.find((f) => f.id === fileId);
        if (!file) {
          continue;
        }

        const filePath = path.join(this.filesDir, fileIdMap[fileId]!);
        fs.rmSync(filePath, { force: true });
      }
    }
  }

  public async cleanTempFiles(): Promise<void> {
    this.debug(`Checking temp files for workspace ${this.workspace.id}`);

    if (!fs.existsSync(this.tempFilesDir)) {
      return;
    }

    const files = fs.readdirSync(this.tempFilesDir);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const file of files) {
      const filePath = path.join(this.tempFilesDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < oneDayAgo) {
        try {
          fs.unlinkSync(filePath);
          this.debug(`Deleted old temp file: ${filePath}`);
        } catch (error) {
          this.debug(`Failed to delete temp file: ${filePath}`, error);
        }
      }
    }
  }

  public async syncServerFile(file: SyncFileData): Promise<void> {
    const existingFile = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', file.id)
      .executeTakeFirst();

    const revision = BigInt(file.revision);
    if (existingFile) {
      if (existingFile.revision === revision) {
        this.debug(`Server file ${file.id} is already synced`);
        return;
      }

      const updatedFile = await this.workspace.database
        .updateTable('files')
        .returningAll()
        .set({
          name: file.name,
          original_name: file.originalName,
          mime_type: file.mimeType,
          extension: file.extension,
          size: file.size,
          parent_id: file.parentId,
          root_id: file.rootId,
          status: file.status,
          type: file.type,
          updated_at: file.updatedAt ?? undefined,
          updated_by: file.updatedBy ?? undefined,
          revision,
        })
        .where('id', '=', file.id)
        .executeTakeFirst();

      if (!updatedFile) {
        return;
      }

      eventBus.publish({
        type: 'file_updated',
        accountId: this.workspace.accountId,
        workspaceId: this.workspace.id,
        file: mapFile(updatedFile),
      });

      this.triggerUploads();
      this.triggerDownloads();

      this.debug(`Server file ${file.id} has been synced`);
      return;
    }

    const createdFile = await this.workspace.database
      .insertInto('files')
      .returningAll()
      .values({
        id: file.id,
        revision,
        type: file.type,
        parent_id: file.parentId,
        root_id: file.rootId,
        name: file.name,
        original_name: file.originalName,
        mime_type: file.mimeType,
        extension: file.extension,
        size: file.size,
        created_at: file.createdAt,
        created_by: file.createdBy,
        updated_at: file.updatedAt,
        updated_by: file.updatedBy,
        status: file.status,
        download_progress: 0,
        download_retries: 0,
        upload_progress: 0,
        upload_retries: 0,
        download_status: DownloadStatus.None,
        upload_status: UploadStatus.None,
      })
      .executeTakeFirst();

    if (!createdFile) {
      return;
    }

    eventBus.publish({
      type: 'file_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      file: mapFile(createdFile),
    });

    this.debug(`Server file ${file.id} has been synced`);
  }

  public async revertFileCreate(fileId: string) {
    const deletedFile = await this.workspace.database
      .deleteFrom('files')
      .returningAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!deletedFile) {
      return;
    }

    const deletedNode = await this.workspace.database
      .deleteFrom('nodes')
      .returningAll()
      .where('id', '=', deletedFile.parent_id)
      .executeTakeFirst();

    if (!deletedNode) {
      return;
    }

    await this.workspace.database
      .deleteFrom('node_states')
      .where('id', '=', deletedNode.id)
      .execute();

    await this.workspace.database
      .deleteFrom('node_interactions')
      .where('node_id', '=', deletedNode.id)
      .execute();

    await this.workspace.database
      .deleteFrom('node_reactions')
      .where('node_id', '=', deletedNode.id)
      .execute();

    const filePath = path.join(
      this.filesDir,
      `${fileId}${deletedFile.extension}`
    );

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }

    eventBus.publish({
      type: 'file_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      file: mapFile(deletedFile),
    });

    eventBus.publish({
      type: 'node_deleted',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      node: mapNode(deletedNode),
    });
  }

  private buildFilePath(id: string, extension: string): string {
    return path.join(this.filesDir, `${id}${extension}`);
  }
}
