import {
  canCreateNode,
  generateId,
  IdType,
  FileAttributes,
} from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import {
  FileCreateMutationInput,
  FileCreateMutationOutput,
} from '@/shared/mutations/files/file-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { fetchNode } from '@/main/lib/utils';
import { mapNode } from '@/main/lib/mappers';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';

export class FileCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<FileCreateMutationInput>
{
  async handleMutation(
    input: FileCreateMutationInput
  ): Promise<FileCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);
    const node = await fetchNode(workspace.database, input.parentId);
    if (!node) {
      throw new MutationError(
        MutationErrorCode.NodeNotFound,
        'There was an error while fetching the node. Please make sure you have access to this node.'
      );
    }

    const root = await fetchNode(workspace.database, node.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    const attributes: FileAttributes = {
      type: 'file',
      parentId: node.id,
    };

    if (
      !canCreateNode(
        {
          user: {
            userId: workspace.userId,
            role: workspace.role,
          },
          root: mapNode(root),
        },
        'file'
      )
    ) {
      throw new MutationError(
        MutationErrorCode.FileCreateForbidden,
        'You are not allowed to upload a file in this node.'
      );
    }

    const fileId = generateId(IdType.File);
    await workspace.files.createFile(input.filePath, fileId, node.id, root);
    await workspace.nodes.createNode({
      id: fileId,
      attributes,
      parentId: node.id,
    });

    return {
      id: fileId,
    };
  }
}
