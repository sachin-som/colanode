import { generateId, IdType, PageAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  PageCreateMutationInput,
  PageCreateMutationOutput,
} from '@/shared/mutations/pages/page-create';

export class PageCreateMutationHandler
  implements MutationHandler<PageCreateMutationInput>
{
  async handleMutation(
    input: PageCreateMutationInput
  ): Promise<PageCreateMutationOutput> {
    const id = generateId(IdType.Page);
    const attributes: PageAttributes = {
      type: 'page',
      parentId: input.parentId,
      avatar: input.avatar,
      name: input.name,
      content: {},
    };

    await entryService.createEntry(input.userId, {
      id,
      attributes,
      parentId: input.parentId,
    });

    return {
      id: id,
    };
  }
}
