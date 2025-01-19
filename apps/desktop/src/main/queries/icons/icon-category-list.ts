import { iconDatabase } from '@/main/lib/assets';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { IconCategoryListQueryInput } from '@/shared/queries/icons/icon-category-list';
import { IconCategory } from '@/shared/types/icons';
import { Event } from '@/shared/types/events';

export class IconCategoryListQueryHandler
  implements QueryHandler<IconCategoryListQueryInput>
{
  public async handleQuery(
    _: IconCategoryListQueryInput
  ): Promise<IconCategory[]> {
    const data = iconDatabase.selectFrom('categories').selectAll().execute();
    return data;
  }

  public async checkForChanges(
    _: Event,
    __: IconCategoryListQueryInput,
    ___: IconCategory[]
  ): Promise<ChangeCheckResult<IconCategoryListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
