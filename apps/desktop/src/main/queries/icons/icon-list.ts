import { iconDatabase } from '@/main/lib/assets';
import { mapIcon } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { IconListQueryInput } from '@/shared/queries/icons/icon-list';
import { Icon } from '@/shared/types/icons';
import { Event } from '@/shared/types/events';

export class IconListQueryHandler implements QueryHandler<IconListQueryInput> {
  public async handleQuery(input: IconListQueryInput): Promise<Icon[]> {
    const offset = input.page * input.count;
    const data = await iconDatabase
      .selectFrom('icons')
      .selectAll()
      .where('category_id', '=', input.category)
      .limit(input.count)
      .offset(offset)
      .execute();

    const icons: Icon[] = data.map(mapIcon);
    return icons;
  }

  public async checkForChanges(
    _: Event,
    __: IconListQueryInput,
    ___: Icon[]
  ): Promise<ChangeCheckResult<IconListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
