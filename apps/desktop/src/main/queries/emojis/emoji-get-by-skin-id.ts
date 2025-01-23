import { emojiDatabase } from '@/main/lib/assets';
import { mapEmoji } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojiGetBySkinIdQueryInput } from '@/shared/queries/emojis/emoji-get-by-skin-id';
import { Emoji } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojiGetBySkinIdQueryHandler
  implements QueryHandler<EmojiGetBySkinIdQueryInput>
{
  public async handleQuery(input: EmojiGetBySkinIdQueryInput): Promise<Emoji> {
    const data = await emojiDatabase
      .selectFrom('emojis')
      .innerJoin('emoji_svgs', 'emojis.id', 'emoji_svgs.emoji_id')
      .selectAll('emojis')
      .where('emoji_svgs.skin_id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      throw new Error('Emoji not found');
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetBySkinIdQueryInput,
    ___: Emoji
  ): Promise<ChangeCheckResult<EmojiGetBySkinIdQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
