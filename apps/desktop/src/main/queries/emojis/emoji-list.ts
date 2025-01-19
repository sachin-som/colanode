import { emojiDatabase } from '@/main/lib/assets';
import { mapEmoji } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojiListQueryInput } from '@/shared/queries/emojis/emoji-list';
import { Emoji } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojiListQueryHandler
  implements QueryHandler<EmojiListQueryInput>
{
  public async handleQuery(input: EmojiListQueryInput): Promise<Emoji[]> {
    const offset = input.page * input.count;
    const data = await emojiDatabase
      .selectFrom('emojis')
      .selectAll()
      .where('category_id', '=', input.category)
      .limit(input.count)
      .offset(offset)
      .execute();

    const emojis: Emoji[] = data.map(mapEmoji);
    return emojis;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiListQueryInput,
    ___: Emoji[]
  ): Promise<ChangeCheckResult<EmojiListQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
