import { PageAttributes } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import {
  PageUpdateMutationInput,
  PageUpdateMutationOutput,
} from '@/shared/mutations/pages/page-update';

export class PageUpdateMutationHandler
  implements MutationHandler<PageUpdateMutationInput>
{
  async handleMutation(
    input: PageUpdateMutationInput
  ): Promise<PageUpdateMutationOutput> {
    const result = await entryService.updateEntry<PageAttributes>(
      input.pageId,
      input.userId,
      (attributes) => {
        attributes.name = input.name;
        attributes.avatar = input.avatar;

        return attributes;
      }
    );

    if (result === 'unauthorized') {
      throw new MutationError(
        MutationErrorCode.PageUpdateForbidden,
        "You don't have permission to update this page."
      );
    }

    if (result !== 'success') {
      throw new MutationError(
        MutationErrorCode.PageUpdateFailed,
        'Something went wrong while updating the page. Please try again later.'
      );
    }

    return {
      success: true,
    };
  }
}
