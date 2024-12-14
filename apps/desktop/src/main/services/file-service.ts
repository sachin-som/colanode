import {
  CompleteUploadOutput,
  CreateDownloadOutput,
  CreateUploadOutput,
  extractFileType,
  FileAttributes,
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
    uploadId: string,
    fileExtension: string,
    userId: string
  ): void {
    const filesDir = getWorkspaceFilesDirectoryPath(userId);

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const destinationFilePath = path.join(
      filesDir,
      `${fileId}_${uploadId}${fileExtension}`
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
      .selectFrom('uploads')
      .selectAll()
      .where('progress', '=', 0)
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
      if (upload.retry_count >= 5) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      const file = await workspaceDatabase
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', upload.node_id)
        .executeTakeFirst();

      if (!file) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      const transactions = await workspaceDatabase
        .selectFrom('transactions')
        .selectAll()
        .where('node_id', '=', upload.node_id)
        .where('status', '=', 'pending')
        .execute();

      if (transactions.length > 0) {
        this.debug(
          `Transactions found for node ${upload.node_id}, skipping upload until transactions are completed`
        );
        continue;
      }

      const attributes: FileAttributes = JSON.parse(file.attributes);
      const filePath = path.join(
        filesDir,
        `${upload.node_id}_${upload.upload_id}${attributes.extension}`
      );

      if (!fs.existsSync(filePath)) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.post<CreateUploadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/uploads`,
          {
            fileId: file.id,
            uploadId: upload.upload_id,
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
            'Content-Type': attributes.mimeType,
            'Content-Length': attributes.size,
          },
        });

        const { status } = await httpClient.put<CompleteUploadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/uploads/${data.uploadId}`,
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
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();
      } catch (error) {
        console.log('error', error);
        await workspaceDatabase
          .updateTable('uploads')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('node_id', '=', upload.node_id)
          .execute();
      }
    }
  }

  public async downloadFiles(userId: string): Promise<void> {
    const workspaceDatabase =
      await databaseService.getWorkspaceDatabase(userId);

    const downloads = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('progress', '=', 0)
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
        .selectFrom('nodes')
        .selectAll()
        .where('id', '=', download.node_id)
        .executeTakeFirst();

      if (!file) {
        await workspaceDatabase
          .deleteFrom('downloads')
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_deleted',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: download.progress,
            retryCount: download.retry_count,
          },
        });

        continue;
      }

      const attributes: FileAttributes = JSON.parse(file.attributes);
      const filePath = path.join(
        filesDir,
        `${download.node_id}_${download.upload_id}${attributes.extension}`
      );

      if (fs.existsSync(filePath)) {
        await workspaceDatabase
          .updateTable('downloads')
          .set({
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: 100,
            retryCount: download.retry_count,
          },
        });

        continue;
      }

      if (!serverService.isAvailable(credentials.serverDomain)) {
        continue;
      }

      try {
        const { data } = await httpClient.get<CreateDownloadOutput>(
          `/v1/workspaces/${credentials.workspaceId}/downloads/${download.node_id}`,
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

        await workspaceDatabase
          .updateTable('downloads')
          .set({ progress: 100 })
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: 100,
            retryCount: download.retry_count,
          },
        });
      } catch (error) {
        console.log('error', error);

        await workspaceDatabase
          .updateTable('downloads')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('node_id', '=', download.node_id)
          .execute();

        eventBus.publish({
          type: 'download_updated',
          userId,
          download: {
            nodeId: download.node_id,
            uploadId: download.upload_id,
            createdAt: download.created_at,
            updatedAt: download.updated_at,
            progress: download.progress,
            retryCount: download.retry_count + 1,
          },
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
      const downloads = await workspaceDatabase
        .selectFrom('downloads')
        .select(['node_id'])
        .where('node_id', 'in', fileIds)
        .execute();

      for (const fileId of fileIds) {
        if (!downloads.some((d) => d.node_id === fileId)) {
          const filePath = path.join(
            getWorkspaceFilesDirectoryPath(userId),
            fileIdMap[fileId]!
          );
          fs.rmSync(filePath, { force: true });
        }
      }
    }
  }
}

export const fileService = new FileService();
