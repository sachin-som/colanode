import { net } from 'electron';
import path from 'path';
import fs from 'fs';
import { databaseManager } from '@/main/data/database-manager';
import { httpClient } from '@/lib/http-client';
import { getAccountAvatarsDirectoryPath } from '@/main/utils';

class AvatarManager {
  public async handleAvatarRequest(request: Request): Promise<Response> {
    const url = request.url.replace('avatar://', '');
    const [accountId, avatarId] = url.split('/');
    const avatarsDir = getAccountAvatarsDirectoryPath(accountId);
    const avatarPath = path.join(avatarsDir, `${avatarId}.jpeg`);
    const avatarLocalUrl = `file://${avatarPath}`;

    // Check if the avatar file already exists
    if (fs.existsSync(avatarPath)) {
      return net.fetch(avatarLocalUrl);
    }

    // Download the avatar file if it doesn't exist
    const credentials = await databaseManager.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['domain', 'attributes', 'token'])
      .where('id', '=', accountId)
      .executeTakeFirst();

    if (!credentials) {
      return new Response(null, { status: 404 });
    }

    const response = await httpClient.get<any>(`/v1/avatars/${avatarId}`, {
      serverDomain: credentials.domain,
      serverAttributes: credentials.attributes,
      token: credentials.token,
      responseType: 'stream',
    });

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
        // Ensure the file is written before trying to fetch it
        resolve(net.fetch(avatarLocalUrl));
      });

      fileStream.on('error', (err) => {
        reject(new Response(null, { status: 500, statusText: err.message }));
      });
    });
  }
}

export const avatarManager = new AvatarManager();
