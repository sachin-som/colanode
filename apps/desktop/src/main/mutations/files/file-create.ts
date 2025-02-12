import { generateId, IdType, FileAttributes } from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/files/file-create';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FileCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const attributes: FileAttributes = {
      type: 'file',
      parentId: input.parentId,
    };

    const fileId = generateId(IdType.File);
    await workspace.nodes.createNode({
      id: fileId,
      attributes,
      parentId: input.parentId,
    });

    await workspace.files.createFile(fileId, input.filePath);

    return {
      id: fileId,
    };
  }
}
