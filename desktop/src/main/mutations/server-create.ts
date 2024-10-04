import axios from 'axios';
import { databaseManager } from '@/main/data/database-manager';
import { MutationHandler, MutationResult } from '@/types/mutations';
import { ServerCreateMutationInput } from '@/types/mutations/server-create';
import { ServerConfig } from '@/types/servers';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  async handleMutation(
    input: ServerCreateMutationInput,
  ): Promise<MutationResult<ServerCreateMutationInput>> {
    const { data } = await axios.get<ServerConfig>(
      `http://${input.domain}/v1/config`,
    );

    await databaseManager.appDatabase
      .insertInto('servers')
      .values({
        domain: input.domain,
        name: data.name,
        avatar: data.avatar,
        attributes: JSON.stringify(data.attributes),
        version: data.version,
        created_at: new Date().toISOString(),
      })
      .execute();

    return {
      output: {
        success: true,
      },
      changes: [
        {
          type: 'app',
          table: 'servers',
        },
      ],
    };
  }
}
