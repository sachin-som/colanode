import { iconDatabase } from '@/main/lib/assets';
import { mapIcon } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { IconSearchQueryInput } from '@/shared/queries/icons/icon-search';
import { Icon } from '@/shared/types/icons';
import { Event } from '@/shared/types/events';

export class IconSearchQueryHandler
  implements QueryHandler<IconSearchQueryInput>
{
  public async handleQuery(input: IconSearchQueryInput): Promise<Icon[]> {
    const data = await iconDatabase
      .selectFrom('icons')
      .innerJoin('icon_search', 'icons.id', 'icon_search.id')
      .selectAll('icons')
      .where('icon_search.text', 'match', `${input.query}*`)
      .limit(input.count)
      .execute();

    const icons: Icon[] = data.map(mapIcon);
    return icons;
  }

  public async checkForChanges(
    _: Event,
    __: IconSearchQueryInput,
    ___: Icon[]
  ): Promise<ChangeCheckResult<IconSearchQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
