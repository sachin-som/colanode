import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadOutput,
  extractFileType,
  SyncFileData,
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
  mapFile,
  mapFileState,
} from '@/main/utils';
import { eventBus } from '@/shared/lib/event-bus';
import { httpClient } from '@/shared/lib/http-client';
import { FileMetadata } from '@/shared/types/files';

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
      .where('upload_status', '=', 'pending')
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
            upload_status: 'failed',
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
        await axios.put(presignedUrl, fileStream, {
          headers: {
            'Content-Type': file.mime_type,
            'Content-Length': file.size,
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
            upload_status: 'completed',
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
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const downloads = await workspaceDatabase
      .selectFrom('file_states')
      .selectAll()
      .where('download_status', '=', 'pending')
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
            download_status: 'completed',
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
        await axios
          .get(presignedUrl, { responseType: 'stream' })
          .then((response) => {
            response.data.pipe(fileStream);
          });

        const updatedFileState = await workspaceDatabase
          .updateTable('file_states')
          .returningAll()
          .set({
            download_status: 'completed',
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
        fileIdMap[file.split('_')[0]!] = file;
      }

      const fileIds = Object.keys(fileIdMap);
      const fileStates = await workspaceDatabase
        .selectFrom('file_states')
        .select(['file_id'])
        .where('file_id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        if (!fileStates.some((f) => f.file_id === fileId)) {
          const filePath = path.join(
            getWorkspaceFilesDirectoryPath(userId),
            fileIdMap[fileId]!
          );
          fs.rmSync(filePath, { force: true });

          const deletedFileState = await workspaceDatabase
            .deleteFrom('file_states')
            .returningAll()
            .where('file_id', '=', fileId)
            .executeTakeFirst();

          if (!deletedFileState) {
            continue;
          }

          eventBus.publish({
            type: 'file_state_deleted',
            userId,
            fileState: mapFileState(deletedFileState),
          });
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
}

export const fileService = new FileService();
