import { assetService } from '@/main/services/asset-service';
import { QueryHandler, ChangeCheckResult } from '@/main/types';
import { IconsGetQueryInput } from '@/shared/queries/icons-get';
import { IconData } from '@/shared/types/icons';
import { Event } from '@/shared/types/events';

export class IconsGetQueryHandler implements QueryHandler<IconsGetQueryInput> {
  public async handleQuery(_: IconsGetQueryInput): Promise<IconData> {
    const data = assetService.getIconData();

    return data;
  }

  public async checkForChanges(
    _: Event,
    __: IconsGetQueryInput,
    ___: IconData
  ): Promise<ChangeCheckResult<IconsGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
