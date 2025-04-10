import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { mapAppMetadata } from '@/main/lib/mappers';
import { AppMetadataListQueryInput } from '@/shared/queries/apps/app-metadata-list';
import { Event } from '@/shared/types/events';
import { AppMetadata } from '@/shared/types/apps';
import { SelectAppMetadata } from '@/main/databases/app/schema';
import { appService } from '@/main/services/app-service';

export class AppMetadataListQueryHandler
  implements QueryHandler<AppMetadataListQueryInput>
{
  public async handleQuery(
    _: AppMetadataListQueryInput
  ): Promise<AppMetadata[]> {
    const rows = await this.getAppMetadata();
    if (!rows) {
      return [];
    }

    return rows.map(mapAppMetadata);
  }

  public async checkForChanges(
    event: Event,
    _: AppMetadataListQueryInput,
    output: AppMetadata[]
  ): Promise<ChangeCheckResult<AppMetadataListQueryInput>> {
    if (event.type === 'app_metadata_saved') {
      const newOutput = [
        ...output.filter((metadata) => metadata.key !== event.metadata.key),
        event.metadata,
      ];

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    if (event.type === 'app_metadata_deleted') {
      const newOutput = output.filter(
        (metadata) => metadata.key !== event.metadata.key
      );

      return {
        hasChanges: true,
        result: newOutput,
      };
    }

    return {
      hasChanges: false,
    };
  }

  private async getAppMetadata(): Promise<SelectAppMetadata[] | undefined> {
    const rows = await appService.database
      .selectFrom('metadata')
      .selectAll()
      .execute();

    return rows;
  }
}
