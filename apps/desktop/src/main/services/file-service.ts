import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadOutput,
  extractFileType,
  SyncFileData,
  SyncFileInteractionData,
  SyncFileTombstoneData,
} from '@colanode/core';
import axios from 'axios';
import mime from 'mime-types';

import { net, shell } from 'electron';
import fs from 'fs';
import path from 'path';

import { createDebugger } from '@/main/debugger';
import { databaseService } from '@/main/data/database-service';
import { serverService } from '@/main/services/server-service';
import {
  fetchWorkspaceCredentials,
  getWorkspaceFilesDirectoryPath,
  getWorkspaceTempFilesDirectoryPath,
  mapFile,
  mapFileInteraction,
  mapFileState,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import {
  DownloadStatus,
  FileMetadata,
  UploadStatus,
} from '@/shared/types/files';

class FileService {
  private readonly debug = createDebugger('service:file');

  public async handleFileRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file://', '');
    const [userId, file] = url.split('/');
    if (!userId || !file) {
      this.debug(`Invalid file request url: ${url}`);
      return new Response(null, { status: 400 });
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, file);

    if (fs.existsSync(filePath)) {
      const fileUrl = `file://${filePath}`;
      return net.fetch(fileUrl);
    }

    this.debug(`File ${file} not found for user ${userId}`);
    return new Response(null, { status: 404 });
  }

  public async handleFilePreviewRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file-preview://', 'file://');
    return net.fetch(url);
  }

  public copyFileToWorkspace(
    filePath: string,
    fileId: string,
    fileExtension: string,
    userId: string
  ): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const destinationFilePath = path.join(
      filesDir,
      `${fileId}${fileExtension}`
    );

    this.debug(
      `Copying file ${filePath} to ${destinationFilePath} for user ${userId}`
    );
    fs.copyFileSync(filePath, destinationFilePath);

    // check if the file is in the temp files directory. If it is in
    // temp files directory it means it has been pasted or dragged
    // therefore we need to delete it
    const fileDirectory = path.dirname(filePath);
    const tempFilesDir = getWorkspaceTempFilesDirectoryPath(userId);
    if (fileDirectory === tempFilesDir) {
      fs.rmSync(filePath);
    }
  }

  public openFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);

    this.debug(`Opening file ${filePath} for user ${userId}`);
    shell.openPath(filePath);
  }

  public deleteFile(userId: string, id: string, extension: string): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    const filePath = path.join(filesDir, `${id}${extension}`);

    this.debug(`Deleting file ${filePath} for user ${userId}`);
    fs.rmSync(filePath, { force: true });
  }

  public getFileMetadata(filePath: string): FileMetadata | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const mimeType = mime.lookup(filePath);
    if (mimeType === false) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const type = extractFileType(mimeType);

    this.debug(`Getting file metadata for ${filePath}`);

    return {
      path: filePath,
      mimeType,
      extension: path.extname(filePath),
      name: path.basename(filePath),
      size: stats.size,
      type,
    };
  }

  public async uploadFiles(userId: string): Promise<void> {
    this.debug(`Uploading files for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const uploads = await workspaceDatabase
      .selectFrom('file_states')
      .selectAll()
      .where('upload_status', '=', UploadStatus.Pending)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(`Workspace credentials not found for user ${userId}`);
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    for (const upload of uploads) {
      if (upload.upload_retries >= 5) {
        await workspaceDatabase
          .updateTable('file_states')
          .set({
            upload_status: UploadStatus.Failed,
            updated_at: new Date().toISOString(),
          })
          .where('file_id', '=', upload.file_id)
          .execute();

        continue;
      }

      const file = await workspaceDatabase
        .selectFrom('files')
        .selectAll()
        .where('id', '=', upload.file_id)
        .executeTakeFirst();

      if (!file) {
        await workspaceDatabase
          .deleteFrom('file_states')
          .where('file_id', '=', upload.file_id)
          .execute();

        continue;
      }

      const filePath = path.join(filesDir, `${file.id}${file.extension}`);

      if (!fs.existsSync(filePath)) {
        await workspaceDatabase
          .deleteFrom('file_states')
          .where('file_id', '=', file.id)
          .execute();

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.post<CreateUploadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/files`,
          {
            fileId: file.id,
          },
          {
            domain: credentials.serverDomain,
            token: credentials.token,
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
            const progress = Math.round(
              (progressEvent.loaded / file.size) * 100
            );

            if (progress >= lastProgress) {
              return;
            }

            lastProgress = progress;

            const updatedFileState = await workspaceDatabase
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
              userId,
              fileState: mapFileState(updatedFileState),
            });
          },
        });

        const { status } = await httpClient.put<CompleteUploadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/files/${file.id}`,
          {},
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
        );

        if (status !== 200) {
          continue;
        }

        await workspaceDatabase
          .updateTable('file_states')
          .set({
            upload_status: UploadStatus.Completed,
            upload_progress: 100,
            updated_at: new Date().toISOString(),
          })
          .where('file_id', '=', file.id)
          .execute();
      } catch {
        await workspaceDatabase
          .updateTable('file_states')
          .set((eb) => ({ upload_retries: eb('upload_retries', '+', 1) }))
          .where('file_id', '=', file.id)
          .execute();
      }
    }
  }

  public async downloadFiles(userId: string): Promise<void> {
    this.debug(`Downloading files for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const downloads = await workspaceDatabase
      .selectFrom('file_states')
      .selectAll()
      .where('download_status', '=', DownloadStatus.Pending)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    const credentials = await fetchWorkspaceCredentials(userId);
    if (!credentials) {
      this.debug(`Workspace credentials not found for user ${userId}`);
      return;
    }

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    for (const download of downloads) {
      const file = await workspaceDatabase
        .selectFrom('files')
        .selectAll()
        .where('id', '=', download.file_id)
        .executeTakeFirst();

      if (!file) {
        const deletedFileState = await workspaceDatabase
          .deleteFrom('file_states')
          .returningAll()
          .where('file_id', '=', download.file_id)
          .executeTakeFirst();

        if (!deletedFileState) {
          continue;
        }

        eventBus.publish({
          type: 'file_state_deleted',
          userId,
          fileState: mapFileState(deletedFileState),
        });

        continue;
      }

      const filePath = path.join(filesDir, `${file.id}${file.extension}`);

      if (fs.existsSync(filePath)) {
        const updatedFileState = await workspaceDatabase
          .updateTable('file_states')
          .returningAll()
          .set({
            download_status: DownloadStatus.Completed,
            download_progress: 100,
            updated_at: new Date().toISOString(),
          })
          .where('file_id', '=', file.id)
          .executeTakeFirst();

        if (!updatedFileState) {
          continue;
        }

        eventBus.publish({
          type: 'file_state_updated',
          userId,
          fileState: mapFileState(updatedFileState),
        });

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.get<CreateDownloadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/downloads/${file.id}`,
          {
            domain: credentials.serverDomain,
            token: credentials.token,
          }
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

              const updatedFileState = await workspaceDatabase
                .updateTable('file_states')
                .returningAll()
                .set({
                  download_progress: progress,
                  updated_at: new Date().toISOString(),
                })
                .where('file_id', '=', file.id)
                .executeTakeFirst();

              if (!updatedFileState) {
                return;
              }

              eventBus.publish({
                type: 'file_state_updated',
                userId,
                fileState: mapFileState(updatedFileState),
              });
            },
          })
          .then((response) => {
            response.data.pipe(fileStream);
          });

        const updatedFileState = await workspaceDatabase
          .updateTable('file_states')
          .returningAll()
          .set({
            download_status: DownloadStatus.Completed,
            download_progress: 100,
            updated_at: new Date().toISOString(),
          })
          .where('file_id', '=', file.id)
          .executeTakeFirst();

        if (!updatedFileState) {
          continue;
        }

        eventBus.publish({
          type: 'file_state_updated',
          userId,
          fileState: mapFileState(updatedFileState),
        });
      } catch {
        const updatedFileState = await workspaceDatabase
          .updateTable('file_states')
          .returningAll()
          .set((eb) => ({ download_retries: eb('download_retries', '+', 1) }))
          .where('file_id', '=', file.id)
          .executeTakeFirst();

        if (!updatedFileState) {
          continue;
        }

        eventBus.publish({
          type: 'file_state_updated',
          userId,
          fileState: mapFileState(updatedFileState),
        });
      }
    }
  }

  public async cleanDeletedFiles(userId: string): Promise<void> {
    this.debug(`Checking deleted files for user ${userId}`);

    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const filesDir = getWorkspaceFilesDirectoryPath(userId);
    if (!fs.existsSync(filesDir)) {
      return;
    }

    const files = fs.readdirSync(filesDir);
    while (files.length > 0) {
      const batch = files.splice(0, 100);
      const fileIdMap: Record<string, string> = {};

      for (const file of batch) {
        const id = path.parse(file).name;
        fileIdMap[id] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const fileStates = await workspaceDatabase
        .selectFrom('file_states')
        .select(['file_id'])
        .where('file_id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        const fileState = fileStates.find((f) => f.file_id === fileId);
        if (fileState) {
          continue;
        }

        const filePath = path.join(
          getWorkspaceFilesDirectoryPath(userId),
          fileIdMap[fileId]!
        );
        fs.rmSync(filePath, { force: true });
      }
    }
  }

  public async cleanTempFiles(userId: string): Promise<void> {
    this.debug(`Checking temp files for user ${userId}`);

    const tempFilesDir = getWorkspaceTempFilesDirectoryPath(userId);
    if (!fs.existsSync(tempFilesDir)) {
      return;
    }

    const files = fs.readdirSync(tempFilesDir);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    for (const file of files) {
      const filePath = path.join(tempFilesDir, file);
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

  public async syncServerFile(
    userId: string,
    file: SyncFileData
  ): Promise<void> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingFile = await workspaceDatabase
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

      const updatedFile = await workspaceDatabase
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
        userId,
        file: mapFile(updatedFile),
      });

      this.debug(`Server file ${file.id} has been synced`);
      return;
    }

    const createdFile = await workspaceDatabase
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
      userId,
      file: mapFile(createdFile),
    });

    this.debug(`Server file ${file.id} has been synced`);
  }

  public async syncServerFileTombstone(
    userId: string,
    fileTombstone: SyncFileTombstoneData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedFile = await workspaceDatabase
      .deleteFrom('files')
      .returningAll()
      .where('id', '=', fileTombstone.id)
      .executeTakeFirst();

    await workspaceDatabase
      .deleteFrom('file_interactions')
      .where('file_id', '=', fileTombstone.id)
      .execute();

    await workspaceDatabase
      .deleteFrom('file_states')
      .where('file_id', '=', fileTombstone.id)
      .execute();

    if (deletedFile) {
      // if the file exists in the workspace, we need to delete it
      const filePath = path.join(
        getWorkspaceFilesDirectoryPath(userId),
        `${fileTombstone.id}${deletedFile.extension}`
      );

      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }

      eventBus.publish({
        type: 'file_deleted',
        userId,
        file: mapFile(deletedFile),
      });
    }

    this.debug(`Server file tombstone ${fileTombstone.id} has been synced`);
  }

  public async syncServerFileInteraction(
    userId: string,
    fileInteraction: SyncFileInteractionData
  ) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const existingFileInteraction = await workspaceDatabase
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

    const createdFileInteraction = await workspaceDatabase
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
      userId,
      fileInteraction: mapFileInteraction(createdFileInteraction),
    });

    this.debug(
      `Server file interaction for file ${fileInteraction.fileId} has been synced`
    );
  }

  public async revertFileCreation(userId: string, fileId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedFile = await workspaceDatabase
      .deleteFrom('files')
      .returningAll()
      .where('id', '=', fileId)
      .executeTakeFirst();

    if (!deletedFile) {
      return;
    }

    await workspaceDatabase
      .deleteFrom('file_states')
      .returningAll()
      .where('file_id', '=', fileId)
      .executeTakeFirst();

    await workspaceDatabase
      .deleteFrom('file_interactions')
      .where('file_id', '=', fileId)
      .execute();

    const filePath = path.join(
      getWorkspaceFilesDirectoryPath(userId),
      `${fileId}${deletedFile.extension}`
    );

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }

    eventBus.publish({
      type: 'file_deleted',
      userId,
      file: mapFile(deletedFile),
    });
  }

  public async revertFileDeletion(userId: string, fileId: string) {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const deletedFile = await workspaceDatabase
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
      userId,
      file: mapFile(deletedFile),
    });
  }
}

export const fileService = new FileService();
