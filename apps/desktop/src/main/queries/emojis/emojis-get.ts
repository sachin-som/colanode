import { getEmojiData } from '@/main/lib/assets';
import { ChangeCheckResult, QueryHandler } from '@/main/lib/types';
import { EmojisGetQueryInput } from '@/shared/queries/emojis/emojis-get';
import { EmojiData } from '@/shared/types/emojis';
import { Event } from '@/shared/types/events';

export class EmojisGetQueryHandler
  implements QueryHandler<EmojisGetQueryInput>
{
  public async handleQuery(_: EmojisGetQueryInput): Promise<EmojiData> {
    const data = getEmojiData();
    return data;
  }

  public async checkForChanges(
    _: Event,
    __: EmojisGetQueryInput,
    ___: EmojiData
  ): Promise<ChangeCheckResult<EmojisGetQueryInput>> {
    return {
      hasChanges: false,
    };
  }
}
