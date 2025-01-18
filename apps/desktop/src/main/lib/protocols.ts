import { net } from 'electron';
import fs from 'fs';
import path from 'path';

import {
  getAccountAvatarsDirectoryPath,
  getAssetsSourcePath,
  getWorkspaceFilesDirectoryPath,
} from '@/main/lib/utils';
import { appService } from '@/main/services/app-service';

export const handleAssetRequest = (request: Request): Promise<Response> => {
  const url = request.url.replace('asset://', '');
  const assetPath = path.join(getAssetsSourcePath(), url);
  const localFileUrl = `file://${assetPath}`;
  return net.fetch(localFileUrl);
};

export const handleAvatarRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('avatar://', '');
  const [accountId, avatarId] = url.split('/');
  if (!accountId || !avatarId) {
    return new Response(null, { status: 400 });
  }

  const avatarsDir = getAccountAvatarsDirectoryPath(accountId);
  const avatarPath = path.join(avatarsDir, `${avatarId}.jpeg`);
  const avatarLocalUrl = `file://${avatarPath}`;

  // Check if the avatar file already exists
  if (fs.existsSync(avatarPath)) {
    return net.fetch(avatarLocalUrl);
  }

  // Download the avatar file if it doesn't exist
  const account = appService.getAccount(accountId);

  if (!account) {
    return new Response(null, { status: 404 });
  }

  const response = await account.client.get<NodeJS.ReadableStream>(
    `/v1/avatars/${avatarId}`,
    {
      responseType: 'stream',
    }
  );

  if (response.status !== 200 || !response.data) {
    return new Response(null, { status: 404 });
  }

  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const fileStream = fs.createWriteStream(avatarPath);

  return new Promise((resolve, reject) => {
    response.data.pipe(fileStream);

    fileStream.on('finish', async () => {
      resolve(net.fetch(avatarLocalUrl));
    });

    fileStream.on('error', (err) => {
      reject(new Response(null, { status: 500, statusText: err.message }));
    });
  });
};

export const handleFilePreviewRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('local-file-preview://', 'file://');
  return net.fetch(url);
};

export const handleFileRequest = async (
  request: Request
): Promise<Response> => {
  const url = request.url.replace('local-file://', '');
  const [accountId, workspaceId, file] = url.split('/');
  if (!accountId || !workspaceId || !file) {
    return new Response(null, { status: 400 });
  }

  const workspaceFilesDir = getWorkspaceFilesDirectoryPath(
    accountId,
    workspaceId
  );
  const filePath = path.join(workspaceFilesDir, file);

  if (fs.existsSync(filePath)) {
    const fileUrl = `file://${filePath}`;
    return net.fetch(fileUrl);
  }

  return new Response(null, { status: 404 });
};
