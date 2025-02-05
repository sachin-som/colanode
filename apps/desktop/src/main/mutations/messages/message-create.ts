import {
  Block,
  canCreateNode,
  EditorNodeTypes,
  generateId,
  IdType,
  MessageAttributes,
} from '@colanode/core';

import { MutationHandler } from '@/main/lib/types';
import { mapContentsToBlocks } from '@/shared/lib/editor';
import {
  MessageCreateMutationInput,
  MessageCreateMutationOutput,
} from '@/shared/mutations/messages/message-create';
import { MutationError, MutationErrorCode } from '@/shared/mutations';
import { fetchNode } from '@/main/lib/utils';
import { WorkspaceMutationHandlerBase } from '@/main/mutations/workspace-mutation-handler-base';
import { mapNode } from '@/main/lib/mappers';

export class MessageCreateMutationHandler
  extends WorkspaceMutationHandlerBase
  implements MutationHandler<MessageCreateMutationInput>
{
  async handleMutation(
    input: MessageCreateMutationInput
  ): Promise<MessageCreateMutationOutput> {
    const workspace = this.getWorkspace(input.accountId, input.workspaceId);

    const node = await fetchNode(workspace.database, input.parentId);
    if (!node) {
      throw new MutationError(
        MutationErrorCode.NodeNotFound,
        'There was an error while fetching the conversation. Please make sure you have access to this conversation.'
      );
    }

    const root = await fetchNode(workspace.database, node.root_id);
    if (!root) {
      throw new MutationError(
        MutationErrorCode.RootNotFound,
        'There was an error while fetching the root. Please make sure you have access to this root.'
      );
    }

    if (
      !canCreateNode(
        {
          user: {
            userId: workspace.userId,
            role: workspace.role,
          },
          root: mapNode(root),
        },
        'message'
      )
    ) {
      throw new MutationError(
        MutationErrorCode.MessageCreateForbidden,
        'You are not allowed to create a message in this conversation.'
      );
    }

    const messageId = generateId(IdType.Message);
    const editorContent = input.content.content ?? [];
    const blocks = mapContentsToBlocks(messageId, editorContent, new Map());

    // check if there are nested nodes (files, pages, folders etc.)
    for (const block of blocks) {
      if (block.type === EditorNodeTypes.FilePlaceholder) {
        const path = block.attrs?.path;
        const fileId = generateId(IdType.File);

        await workspace.files.createFile(path, fileId, messageId, root);

        block.id = fileId;
        block.type = 'file';
        block.attrs = null;
      }
    }

    const blocksRecord = blocks.reduce(
      (acc, block) => {
        acc[block.id] = block;
        return acc;
      },
      {} as Record<string, Block>
    );

    const messageAttributes: MessageAttributes = {
      type: 'message',
      subtype: 'standard',
      parentId: input.parentId,
      content: blocksRecord,
      referenceId: input.referenceId,
    };

    await workspace.nodes.createNode({
      id: messageId,
      attributes: messageAttributes,
      parentId: input.parentId,
    });

    return {
      id: messageId,
    };
  }
}
