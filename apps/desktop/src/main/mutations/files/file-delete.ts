import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  FileDeleteMutationInput,
  FileDeleteMutationOutput,
} from '@/shared/mutations/files/file-delete';

export class FileDeleteMutationHandler
  implements MutationHandler<FileDeleteMutationInput>
{
  async handleMutation(
    input: FileDeleteMutationInput
  ): Promise<FileDeleteMutationOutput> {
    await entryService.deleteEntry(input.fileId, input.userId);

    return {
      success: true,
    };
  }
}
