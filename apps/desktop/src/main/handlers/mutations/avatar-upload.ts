import fs from 'fs';
import FormData from 'form-data';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/operations/mutations';
import { AvatarUploadMutationInput } from '@/operations/mutations/avatar-upload';
import { httpClient } from '@/lib/http-client';

interface AvatarUploadResponse {
  id: string;
}

export class AvatarUploadMutationHandler
  implements MutationHandler<AvatarUploadMutationInput>
{
  async handleMutation(
    input: AvatarUploadMutationInput,
  ): Promise<MutationResult<AvatarUploadMutationInput>> {
    const credentials = await databaseManager.appDatabase
      .selectFrom('accounts')
      .innerJoin('servers', 'accounts.server', 'servers.domain')
      .select(['domain', 'attributes', 'token'])
      .where('id', '=', input.accountId)
      .executeTakeFirst();

    if (!credentials) {
      return {
        output: {
          status: 'error',
          id: null,
        },
      };
    }

    const filePath = input.filePath;
    const fileStream = fs.createReadStream(filePath);

    const formData = new FormData();
    formData.append('avatar', fileStream);

    const { data } = await httpClient.post<AvatarUploadResponse>(
      '/v1/avatars',
      formData,
      {
        serverDomain: credentials.domain,
        serverAttributes: credentials.attributes,
        token: credentials.token,
        headers: formData.getHeaders(),
      },
    );

    return {
      output: {
        status: 'success',
        id: data.id,
      },
    };
  }
}
