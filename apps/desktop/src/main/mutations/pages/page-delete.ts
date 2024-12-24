import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  PageDeleteMutationInput,
  PageDeleteMutationOutput,
} from '@/shared/mutations/pages/page-delete';

export class PageDeleteMutationHandler
  implements MutationHandler<PageDeleteMutationInput>
{
  async handleMutation(
    input: PageDeleteMutationInput
  ): Promise<PageDeleteMutationOutput> {
    await entryService.deleteEntry(input.pageId, input.userId);

    return {
      success: true,
    };
  }
}
