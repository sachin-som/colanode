import { app, net } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import {
  ServerFileDownloadResponse,
  ServerFileUploadResponse,
} from '@/types/files';
import { WorkspaceCredentials } from '@/types/workspaces';
import { databaseManager } from './data/database-manager';
import { httpClient } from '@/lib/http-client';
import { LocalNodeAttributes } from '@/types/nodes';
import { mediator } from '@/main/mediator';

class FileManager {
  private readonly appPath: string;

  constructor() {
    this.appPath = app.getPath('userData');
  }

  public async handleFileRequest(request: Request): Promise<Response> {
    const url = request.url.replace('local-file://', '');
    const [accountId, workspaceId, file] = url.split('/');
    const filesDir = this.getWorkspaceFilesDir(accountId, workspaceId);
    const filePath = path.join(filesDir, file);

    if (fs.existsSync(filePath)) {
      const fileUrl = `file://${filePath}`;
      return net.fetch(fileUrl);
    }

    return new Response(null, { status: 404 });
  }

  public copyFileToWorkspace(
    filePath: string,
    fileId: string,
    fileExtension: string,
    accountId: string,
    workspaceId: string,
  ): void {
    const filesDir = this.getWorkspaceFilesDir(accountId, workspaceId);

    if (!fs.existsSync(filesDir)) {
      fs.mkdirSync(filesDir, { recursive: true });
    }

    const destinationFilePath = path.join(
      filesDir,
      `${fileId}${fileExtension}`,
    );
    fs.copyFileSync(filePath, destinationFilePath);
  }

  public async checkForUploads(
    credentials: WorkspaceCredentials,
  ): Promise<void> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      credentials.userId,
    );

    const uploads = await workspaceDatabase
      .selectFrom('uploads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (uploads.length === 0) {
      return;
    }

    const filesDir = this.getWorkspaceFilesDir(
      credentials.accountId,
      credentials.workspaceId,
    );

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

      const attributes: LocalNodeAttributes = JSON.parse(file.attributes);
      const filePath = path.join(
        filesDir,
        `${upload.node_id}${attributes.extension}`,
      );

      if (!fs.existsSync(filePath)) {
        await workspaceDatabase
          .deleteFrom('uploads')
          .where('node_id', '=', upload.node_id)
          .execute();

        continue;
      }

      try {
        const { data } = await httpClient.post<ServerFileUploadResponse>(
          `/v1/files/${credentials.workspaceId}/${upload.node_id}`,
          {},
          {
            serverDomain: credentials.serverDomain,
            serverAttributes: credentials.serverAttributes,
            token: credentials.token,
          },
        );

        const presignedUrl = data.url;
        const fileStream = fs.createReadStream(filePath);
        await axios.put(presignedUrl, fileStream, {
          headers: {
            'Content-Type': attributes.mimeType,
            'Content-Length': attributes.size,
          },
        });

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

    await mediator.checkForQueryChanges([
      {
        type: 'workspace',
        userId: credentials.userId,
        table: 'uploads',
      },
    ]);
  }

  public async checkForDownloads(
    credentials: WorkspaceCredentials,
  ): Promise<void> {
    const workspaceDatabase = await databaseManager.getWorkspaceDatabase(
      credentials.userId,
    );

    const downloads = await workspaceDatabase
      .selectFrom('downloads')
      .selectAll()
      .where('progress', '=', 0)
      .execute();

    if (downloads.length === 0) {
      return;
    }

    const filesDir = this.getWorkspaceFilesDir(
      credentials.accountId,
      credentials.workspaceId,
    );

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

        continue;
      }

      const attributes: LocalNodeAttributes = JSON.parse(file.attributes);

      const filePath = path.join(
        filesDir,
        `${download.node_id}${attributes.extension}`,
      );

      if (fs.existsSync(filePath)) {
        await workspaceDatabase
          .updateTable('downloads')
          .set({
            progress: 100,
          })
          .where('node_id', '=', download.node_id)
          .execute();

        continue;
      }

      try {
        const { data } = await httpClient.get<ServerFileDownloadResponse>(
          `/v1/files/${credentials.workspaceId}/${download.node_id}`,
          {
            serverDomain: credentials.serverDomain,
            serverAttributes: credentials.serverAttributes,
            token: credentials.token,
          },
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
      } catch (error) {
        console.log('error', error);

        await workspaceDatabase
          .updateTable('downloads')
          .set((eb) => ({ retry_count: eb('retry_count', '+', 1) }))
          .where('node_id', '=', download.node_id)
          .execute();
      }
    }

    await mediator.checkForQueryChanges([
      {
        type: 'workspace',
        userId: credentials.userId,
        table: 'downloads',
      },
    ]);
  }

  private getWorkspaceFilesDir(accountId: string, workspaceId: string): string {
    const accountDir = path.join(this.appPath, accountId);
    const workspaceDir = path.join(accountDir, 'workspaces', workspaceId);
    const filesDir = path.join(workspaceDir, 'files');
    return filesDir;
  }
}

export const fileManager = new FileManager();
