import { emojiDatabase } from '@/main/lib/assets';
import { mapEmoji } from '@/main/lib/mappers';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojiGetQueryInput } from '@/shared/queries/emojis/emoji-get';
import { Emoji } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojiGetQueryHandler implements QueryHandler<EmojiGetQueryInput> {
  public async handleQuery(input: EmojiGetQueryInput): Promise<Emoji> {
    const data = await emojiDatabase
      .selectFrom('emojis')
      .selectAll()
      .where('id', '=', input.id)
      .executeTakeFirst();

    if (!data) {
      throw new Error('Emoji not found');
    }

    const emoji = mapEmoji(data);
    return emoji;
  }

  public async checkForChanges(
    _: Event,
    __: EmojiGetQueryInput,
    ___: Emoji
  ): Promise<ChangeCheckResult<EmojiGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
