import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import { ServerFileUploadResponse } from '@/types/files';
import { WorkspaceCredentials } from '@/types/workspaces';
import { databaseManager } from './data/database-manager';
import { httpClient } from '@/lib/http-client';
import { LocalNodeAttributes } from '@/types/nodes';
import axios from 'axios';

class FileManager {
  private readonly appPath: string;

  constructor() {
    this.appPath = app.getPath('userData');
  }

  public copyFileToWorkspace(
    filePath: string,
    fileId: string,
    fileExtension: string,
    accountId: string,
    workspaceId: string,
  ): void {
    const accountDir = path.join(this.appPath, accountId);
    const workspaceDir = path.join(accountDir, 'workspaces', workspaceId);
    const filesDir = path.join(workspaceDir, 'files');

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

    const accountDir = path.join(this.appPath, credentials.accountId);
    const workspaceDir = path.join(
      accountDir,
      'workspaces',
      credentials.workspaceId,
    );
    const filesDir = path.join(workspaceDir, 'files');

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

        const formData = new FormData();
        formData.append('file', fileStream);

        await axios.put(presignedUrl, formData);

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
}

export const fileManager = new FileManager();
