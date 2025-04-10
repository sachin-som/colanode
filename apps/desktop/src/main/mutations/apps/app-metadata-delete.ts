import { MutationHandler } from '@/main/lib/types';
import { eventBus } from '@/shared/lib/event-bus';
import { mapAppMetadata } from '@/main/lib/mappers';
import { appService } from '@/main/services/app-service';
import {
  AppMetadataDeleteMutationInput,
  AppMetadataDeleteMutationOutput,
} from '@/shared/mutations/apps/app-metadata-delete';

export class AppMetadataDeleteMutationHandler
  implements MutationHandler<AppMetadataDeleteMutationInput>
{
  async handleMutation(
    input: AppMetadataDeleteMutationInput
  ): Promise<AppMetadataDeleteMutationOutput> {
    const deletedMetadata = await appService.database
      .deleteFrom('metadata')
      .where('key', '=', input.key)
      .returningAll()
      .executeTakeFirst();

    if (!deletedMetadata) {
      return {
        success: true,
      };
    }

    eventBus.publish({
      type: 'app_metadata_deleted',
      metadata: mapAppMetadata(deletedMetadata),
    });

    return {
      success: true,
    };
  }
}
