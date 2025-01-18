import { getIconData } from '@/main/lib/assets';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { IconsGetQueryInput } from '@/shared/queries/icons/icons-get';
import { Event } from '@/shared/types/events';
import { IconData } from '@/shared/types/icons';

export class IconsGetQueryHandler implements QueryHandler<IconsGetQueryInput> {
  public async handleQuery(_: IconsGetQueryInput): Promise<IconData> {
    const data = getIconData();

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
