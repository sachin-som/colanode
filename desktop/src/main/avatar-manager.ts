import { app, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { databaseManager } from '@/main/data/database-manager';
import { buildAxiosInstance } from '@/lib/servers';

class AvatarManager {
  private readonly appPath: string;

  constructor() {
    this.appPath = app.getPath('userData');
  }

  public async handleAvatarRequest(request: Request): Promise<Response> {
    const url = request.url.replace('avatar://', '');
    const [accountId, avatarId] = url.split('/');
    const avatarsDir = path.join(this.appPath, accountId, 'avatars');
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

    const axios = buildAxiosInstance(
      credentials.domain,
      credentials.attributes,
      credentials.token,
    );

    const response = await axios.get(`/v1/avatars/${avatarId}`, {
      responseType: 'stream',
    });
    if (response.status !== 200 || !response.data) {
      return new Response(null, { status: 404 });
    }

    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    const fileStream = fs.createWriteStream(avatarPath);
    response.data.pipe(fileStream);
    return net.fetch(avatarLocalUrl);
  }
}

export const avatarManager = new AvatarManager();
