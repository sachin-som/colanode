import { emojiDatabase } from '@/main/lib/assets';
import { mapEmoji } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojiSearchQueryInput } from '@/shared/queries/emojis/emoji-search';
import { Emoji } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojiSearchQueryHandler
  implements QueryHandler<EmojiSearchQueryInput>
{
  public async handleQuery(input: EmojiSearchQueryInput): Promise<Emoji[]> {
    const data = await emojiDatabase
      .selectFrom('emojis')
      .innerJoin('emoji_search', 'emojis.id', 'emoji_search.id')
      .selectAll('emojis')
      .where('emoji_search.text', 'match', `${input.query}*`)
      .limit(input.count)
      .execute();

    const emojis: Emoji[] = data.map(mapEmoji);
    return emojis;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiSearchQueryInput,
    ___: Emoji[]
  ): Promise<ChangeCheckResult<EmojiSearchQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
