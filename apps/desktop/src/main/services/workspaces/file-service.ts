import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadOutput,
  FileStatus,
  SyncFileData,
  SyncFileInteractionData,
  SyncFileTombstoneData,
  createDebugger,
} from '@colanode/core';
import axios from 'axios';
import ms from 'ms';

import fs from 'fs';
import path from 'path';

import {
  getWorkspaceFilesDirectoryPath,
  getWorkspaceTempFilesDirectoryPath,
  mapFile,
  mapFileInteraction,
  mapFileState,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { DownloadStatus, UploadStatus } from '@/shared/types/files';
import { WorkspaceService } from '@/main/services/workspaces/workspace-service';
import { EventLoop } from '@/shared/lib/event-loop';
import { SelectFileState } from '@/main/databases/workspace';

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
      .selectFrom('file_states')
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

  private async uploadFile(state: SelectFileState): Promise<void> {
    if (state.upload_retries >= UPLOAD_RETRIES_LIMIT) {
      this.debug(
        `File ${state.file_id} upload retries limit reached, marking as failed`
      );

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Failed,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', state.file_id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const file = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', state.file_id)
      .executeTakeFirst();

    if (!file) {
      await this.workspace.database
        .deleteFrom('file_states')
        .where('file_id', '=', state.file_id)
        .execute();

      this.debug(
        `File ${state.file_id} not found, deleting state from database`
      );
      return;
    }

    if (file.version === BigInt(0)) {
      // file is not synced with the server, we need to wait for the sync to complete
      return;
    }

    if (file.status === FileStatus.Ready) {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', state.file_id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }

      return;
    }

    const filePath = this.buildFilePath(state.file_id, file.extension);

    if (!fs.existsSync(filePath)) {
      await this.workspace.database
        .deleteFrom('file_states')
        .where('file_id', '=', file.id)
        .execute();

      this.debug(
        `File ${state.file_id} not found, deleting state from database`
      );
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

          const updatedFileState = await this.workspace.database
            .updateTable('file_states')
            .returningAll()
            .set({
              upload_progress: progress,
              updated_at: new Date().toISOString(),
            })
            .where('file_id', '=', file.id)
            .executeTakeFirst();

          if (!updatedFileState) {
            return;
          }

          eventBus.publish({
            type: 'file_state_updated',
            accountId: this.workspace.accountId,
            workspaceId: this.workspace.id,
            fileState: mapFileState(updatedFileState),
          });
        },
      });

      await this.workspace.account.client.put<CompleteUploadOutput>(
        `/v1/workspaces/${this.workspace.id}/files/${file.id}`,
        {}
      );

      const finalFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          upload_status: UploadStatus.Completed,
          upload_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', file.id)
        .executeTakeFirst();

      if (finalFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(finalFileState),
        });
      }

      this.debug(`File ${file.id} uploaded successfully`);
    } catch {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set((eb) => ({ upload_retries: eb('upload_retries', '+', 1) }))
        .where('file_id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
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
      .selectFrom('file_states')
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

  private async downloadFile(state: SelectFileState): Promise<void> {
    if (state.download_retries >= DOWNLOAD_RETRIES_LIMIT) {
      this.debug(
        `File ${state.file_id} download retries limit reached, marking as failed`
      );

      await this.workspace.database
        .updateTable('file_states')
        .set({
          download_status: DownloadStatus.Failed,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', state.file_id)
        .execute();
    }

    const file = await this.workspace.database
      .selectFrom('files')
      .selectAll()
      .where('id', '=', state.file_id)
      .executeTakeFirst();

    if (!file) {
      this.debug(
        `File ${state.file_id} not found, deleting state from database`
      );

      const deletedFileState = await this.workspace.database
        .deleteFrom('file_states')
        .returningAll()
        .where('file_id', '=', state.file_id)
        .executeTakeFirst();

      if (deletedFileState) {
        eventBus.publish({
          type: 'file_state_deleted',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(deletedFileState),
        });
      }

      return;
    }

    const filePath = this.buildFilePath(state.file_id, file.extension);

    if (fs.existsSync(filePath)) {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
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

            const updatedFileState = await this.workspace.database
              .updateTable('file_states')
              .returningAll()
              .set({
                download_progress: progress,
                updated_at: new Date().toISOString(),
              })
              .where('file_id', '=', file.id)
              .executeTakeFirst();

            if (updatedFileState) {
              eventBus.publish({
                type: 'file_state_updated',
                accountId: this.workspace.accountId,
                workspaceId: this.workspace.id,
                fileState: mapFileState(updatedFileState),
              });
            }
          },
        })
        .then((response) => {
          response.data.pipe(fileStream);
        });

      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set({
          download_status: DownloadStatus.Completed,
          download_progress: 100,
          updated_at: new Date().toISOString(),
        })
        .where('file_id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    } catch {
      const updatedFileState = await this.workspace.database
        .updateTable('file_states')
        .returningAll()
        .set((eb) => ({ download_retries: eb('download_retries', '+', 1) }))
        .where('file_id', '=', file.id)
        .executeTakeFirst();

      if (updatedFileState) {
        eventBus.publish({
          type: 'file_state_updated',
          accountId: this.workspace.accountId,
          workspaceId: this.workspace.id,
          fileState: mapFileState(updatedFileState),
        });
      }
    }
  }

  public async cleanDeletedFiles(): Promise<void> {
    this.debug(`Checking deleted files for workspace ${this.workspace.id}`);

    const files = fs.readdirSync(this.filesDir);
    while (files.length > 0) {
      const batch = files.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = path.parse(file).name;
        fileIdMap[id] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const fileStates = await this.workspace.database
        .selectFrom('file_states')
        .select(['file_id'])
        .where('file_id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const fileState = fileStates.find((f) => f.file_id === fileId);
        if (fileState) {
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

    const version = BigInt(file.version);
    if (existingFile) {
      if (existingFile.version === version) {
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
          updated_at: file.updatedAt,
          updated_by: file.updatedBy,
          version,
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
        version,
        type: file.type,
        parent_id: file.parentId,
        entry_id: file.entryId,
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

  public async syncServerFileTombstone(fileTombstone: SyncFileTombstoneData) {
    const deletedFile = await this.workspace.database
      .deleteFrom('files')
      .returningAll()
      .where('id', '=', fileTombstone.id)
      .executeTakeFirst();

    await this.workspace.database
      .deleteFrom('file_interactions')
      .where('file_id', '=', fileTombstone.id)
      .execute();

    await this.workspace.database
      .deleteFrom('file_states')
      .where('file_id', '=', fileTombstone.id)
      .execute();

    if (deletedFile) {
      // if the file exists in the workspace, we need to delete it
      const filePath = this.buildFilePath(
        fileTombstone.id,
        deletedFile.extension
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
    }

    this.debug(`Server file tombstone ${fileTombstone.id} has been synced`);
  }

  public async syncServerFileInteraction(
    fileInteraction: SyncFileInteractionData
  ) {
    const existingFileInteraction = await this.workspace.database
      .selectFrom('file_interactions')
      .selectAll()
      .where('file_id', '=', fileInteraction.fileId)
      .executeTakeFirst();

    const version = BigInt(fileInteraction.version);
    if (existingFileInteraction) {
      if (existingFileInteraction.version === version) {
        this.debug(
          `Server file interaction for file ${fileInteraction.fileId} is already synced`
        );
        return;
      }
    }

    const createdFileInteraction = await this.workspace.database
      .insertInto('file_interactions')
      .returningAll()
      .values({
        file_id: fileInteraction.fileId,
        root_id: fileInteraction.rootId,
        collaborator_id: fileInteraction.collaboratorId,
        first_seen_at: fileInteraction.firstSeenAt,
        last_seen_at: fileInteraction.lastSeenAt,
        last_opened_at: fileInteraction.lastOpenedAt,
        first_opened_at: fileInteraction.firstOpenedAt,
        version,
      })
      .onConflict((b) =>
        b.columns(['file_id', 'collaborator_id']).doUpdateSet({
          last_seen_at: fileInteraction.lastSeenAt,
          first_seen_at: fileInteraction.firstSeenAt,
          last_opened_at: fileInteraction.lastOpenedAt,
          first_opened_at: fileInteraction.firstOpenedAt,
          version,
        })
      )
      .executeTakeFirst();

    if (!createdFileInteraction) {
      return;
    }

    eventBus.publish({
      type: 'file_interaction_updated',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      fileInteraction: mapFileInteraction(createdFileInteraction),
    });

    this.debug(
      `Server file interaction for file ${fileInteraction.fileId} has been synced`
    );
  }

  public async revertFileCreation(fileId: string) {
    const deletedFile = await this.workspace.database
      .deleteFrom('files')
      .returningAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!deletedFile) {
      return;
    }

    await this.workspace.database
      .deleteFrom('file_states')
      .returningAll()
      .where('file_id', '=', fileId)
      .executeTakeFirst();

    await this.workspace.database
      .deleteFrom('file_interactions')
      .where('file_id', '=', fileId)
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
  }

  public async revertFileDeletion(fileId: string) {
    const deletedFile = await this.workspace.database
      .updateTable('files')
      .returningAll()
      .set({
        deleted_at: null,
      })
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!deletedFile) {
      return;
    }

    eventBus.publish({
      type: 'file_created',
      accountId: this.workspace.accountId,
      workspaceId: this.workspace.id,
      file: mapFile(deletedFile),
    });
  }

  private buildFilePath(id: string, extension: string): string {
    return path.join(this.filesDir, `${id}${extension}`);
  }
}
