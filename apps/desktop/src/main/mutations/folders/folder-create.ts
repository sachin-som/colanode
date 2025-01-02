import { FolderAttributes, generateId, IdType } from '@colanode/core';

import { entryService } from '@/main/services/entry-service';
import { MutationHandler } from '@/main/types';
import {
  FolderCreateMutationInput,
  FolderCreateMutationOutput,
} from '@/shared/mutations/folders/folder-create';

export class FolderCreateMutationHandler
  implements MutationHandler<FolderCreateMutationInput>
{
  async handleMutation(
    input: FolderCreateMutationInput
  ): Promise<FolderCreateMutationOutput> {
    const id = generateId(IdType.Folder);
    const attributes: FolderAttributes = {
      type: 'folder',
      parentId: input.parentId,
      name: input.name,
      avatar: input.avatar,
      collaborators: {},
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
