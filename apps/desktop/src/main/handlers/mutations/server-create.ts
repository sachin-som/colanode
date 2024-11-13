import axios from 'axios';
import { databaseService } from '@/main/data/database-service';
import { MutationHandler } from '@/main/types';
import {
  ServerCreateMutationInput,
  ServerCreateMutationOutput,
} from '@/shared/mutations/server-create';
import { ServerConfig } from '@/shared/types/servers';
import { eventBus } from '@/shared/lib/event-bus';

export class ServerCreateMutationHandler
  implements MutationHandler<ServerCreateMutationInput>
{
  async handleMutation(
    input: ServerCreateMutationInput
  ): Promise<ServerCreateMutationOutput> {
    const { data } = await axios.get<ServerConfig>(
      `http://${input.domain}/v1/config`
    );

    const createdAt = new Date();
    await databaseService.appDatabase
      .insertInto('servers')
      .values({
        domain: input.domain,
        name: data.name,
        avatar: data.avatar,
        attributes: JSON.stringify(data.attributes),
        version: data.version,
        created_at: createdAt.toISOString(),
      })
      .execute();

    eventBus.publish({
      type: 'server_created',
      server: {
        domain: input.domain,
        name: data.name,
        avatar: data.avatar,
        attributes: data.attributes,
        version: data.version,
        createdAt,
        lastSyncedAt: null,
      },
    });

    return {
      success: true,
    };
  }
}
