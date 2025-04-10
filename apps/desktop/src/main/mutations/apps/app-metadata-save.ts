import { MutationHandler } from '@/main/lib/types';
import {
  AppMetadataSaveMutationInput,
  AppMetadataSaveMutationOutput,
} from '@/shared/mutations/apps/app-metadata-save';
import { eventBus } from '@/shared/lib/event-bus';
import { mapAppMetadata } from '@/main/lib/mappers';
import { appService } from '@/main/services/app-service';

export class AppMetadataSaveMutationHandler
  implements MutationHandler<AppMetadataSaveMutationInput>
{
  async handleMutation(
    input: AppMetadataSaveMutationInput
  ): Promise<AppMetadataSaveMutationOutput> {
    const createdMetadata = await appService.database
      .insertInto('metadata')
      .returningAll()
      .values({
        key: input.key,
        value: JSON.stringify(input.value),
        created_at: new Date().toISOString(),
      })
      .onConflict((cb) =>
        cb.columns(['key']).doUpdateSet({
          value: JSON.stringify(input.value),
          updated_at: new Date().toISOString(),
        })
      )
      .executeTakeFirst();

    if (!createdMetadata) {
      return {
        success: false,
      };
    }

    eventBus.publish({
      type: 'app_metadata_saved',
      metadata: mapAppMetadata(createdMetadata),
    });

    return {
      success: true,
    };
  }
}
