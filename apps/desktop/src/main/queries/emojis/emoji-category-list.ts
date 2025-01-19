import { emojiDatabase } from '@/main/lib/assets';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojiCategoryListQueryInput } from '@/shared/queries/emojis/emoji-category-list';
import { EmojiCategory } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojiCategoryListQueryHandler
  implements QueryHandler<EmojiCategoryListQueryInput>
{
  public async handleQuery(
    _: EmojiCategoryListQueryInput
  ): Promise<EmojiCategory[]> {
    const data = emojiDatabase.selectFrom('categories').selectAll().execute();
    return data;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiCategoryListQueryInput,
    ___: EmojiCategory[]
  ): Promise<ChangeCheckResult<EmojiCategoryListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
